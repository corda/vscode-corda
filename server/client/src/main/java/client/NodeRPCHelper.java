package client;

import client.entities.customExceptions.FlowsNotFoundException;
import com.google.common.collect.ImmutableList;
import kotlin.Pair;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.contracts.StateRef;
import net.corda.core.contracts.TransactionState;
import net.corda.core.crypto.SecureHash;
import net.corda.core.identity.AbstractParty;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.QueryCriteria;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class NodeRPCHelper {

    /**
     * Propagates the maps used to track flow classes, constructors and params.
     * @param jarPath full path to the .jar files containing CorDapp flows
     * @param registeredFlows list of registeredFlows on the Node
     */
    public static Pair<Map, Map> setFlowMaps(String jarPath, List<String> registeredFlows) throws FlowsNotFoundException {
        Map<String, Class> registeredFlowClasses = new HashMap<>();
        Map<String, Map<String, List<Pair<Class, String>>>> registeredFlowParams = new HashMap<>();
        File dir = new File(jarPath);
        List<File> jarFiles = new ArrayList<>();
        File[] filesList = dir.listFiles();
        assert filesList != null;
        for (File file : filesList) {
            if (file.getName().contains(".jar")) {
                jarFiles.add(file);
                System.out.println(file.getName());
            }
        }

        // First add all of the necessary jar files to the class path so that they are available when loading classes
        URLClassLoader sysClassLoader = (URLClassLoader) NodeRPCHelper.class.getClassLoader();
        Method method = null;
        try {
            method = URLClassLoader.class.getDeclaredMethod("addURL", URL.class);
            for(File flowJarFile : jarFiles){
                URL url = flowJarFile.toURI().toURL();
                method.setAccessible(true);
                method.invoke(sysClassLoader, url);
                System.out.println("Loaded URL " );
            }
        } catch (NoSuchMethodException | IllegalAccessException | MalformedURLException | InvocationTargetException e) {
            e.printStackTrace();
        }

        for (File flowJarFile : jarFiles) {
            // load the jar to extract the class
            try {
                URL url = flowJarFile.toURI().toURL();

                URLClassLoader classLoader = new URLClassLoader(
                        new URL[]{url},
                        NodeRPCHelper.class.getClassLoader()
                );

                // iterate through all flows and add to flow -> class map
                for (String flow : registeredFlows) {


                    Class flowClass = null;
                    try {
                        flowClass = Class.forName(flow, true, classLoader);
                        registeredFlowClasses.put(flow, flowClass);
                        System.out.println(flow);
                        System.out.println(flowClass);
                        registeredFlowParams.put(flow, setFlowParams(flowClass));
                    }catch(ClassNotFoundException e){

                    }catch(Throwable t){

                        t.printStackTrace();

                    }

                }

                System.out.println("flows FOUND in file + " + flowJarFile.toString());
                if(registeredFlowParams.isEmpty()){
                    throw new FlowsNotFoundException("Could not find any flows in the node cordapps");
                }
            } catch (MalformedURLException e) {
                //e.printStackTrace();
                System.out.println("flows not found in file " + flowJarFile.toString());
            }
        }

        return new Pair<>(registeredFlowClasses, registeredFlowParams);
    }

    /**
     * setFlowParams - helper for setFlowMaps
     * @param flowClass flow to extract paramTypes from
     * @return list of Classes corresponding to each param of the input flow class
     */
    private static Map<String, List<Pair<Class,String>>> setFlowParams(Class flowClass) {

        Map<String, List<Pair<Class,String>>> constructorToParams = new HashMap<>();
        List<Pair<Class,String>> params; // Pair<paramType, name>
        boolean defaultConstructorMarker; // sentinel for skipping kotlin default constructor
        StringBuilder constructorID; // "arg0 arg1 ..."

        // construct params List for each constructor
        for (Constructor c : ImmutableList.copyOf(flowClass.getConstructors())) {
            params = new ArrayList<>();
            defaultConstructorMarker = false;
            constructorID = new StringBuilder();

            for(Parameter param: ImmutableList.copyOf(c.getParameters())){
                if(param.isNamePresent()){
                    params.add(new Pair(param.getType(), param.getName()));
                    if ((constructorID.length() == 0)) {
                        constructorID.append(param.getName() + ":" + param.getType().getSimpleName());
                    } else {
                        constructorID.append(", ").append(param.getName() + ":" + param.getType().getSimpleName());
                    }
                }else{
                    defaultConstructorMarker = true;
                }
            }

            // skip if contains type: DefaultConstructorMarker
            if (defaultConstructorMarker) continue;

            // create constructor stringKey and place in Map
            constructorToParams.putIfAbsent(constructorID.toString(), params);
        }

        return constructorToParams;
    }

    /**
     * @param proxy
     * @param stateRef
     * @return TransactionState object of the given stateRef
     */
    public static TransactionState getStateFromRef(CordaRPCOps proxy, StateRef stateRef){
        QueryCriteria stateRefCriteria = new QueryCriteria.VaultQueryCriteria()
                .withStateRefs(Arrays.asList(stateRef));
        Vault.Page<ContractState> result = proxy.vaultQueryByCriteria(stateRefCriteria, ContractState.class);
        return result.getStates().get(0).getState();
    }

    /**
     * @param stateMeta
     * @param states
     * @return a mapping from secureHash to a TransRecord object
     */
    public static Map<SecureHash, TransRecord> createTransactionMap(List<Vault.StateMetadata> stateMeta, List<StateAndRef<ContractState>> states) {
        Map<SecureHash, TransRecord> transMap = new HashMap<>();

        for (int i = 0; i < states.size(); i++) {
            SecureHash txHash = states.get(i).getRef().getTxhash();

            TransRecord currTrans;

            // create new Transrecord if not found in map
            if (!transMap.containsKey(txHash)) {
                Instant timeStamp = stateMeta.get(i).getRecordedTime();
                currTrans = new TransRecord(txHash, timeStamp);
                transMap.put(txHash, currTrans);
            }

            currTrans = transMap.get(txHash);
            currTrans.addToStates(states.get(i).getState().getData(), stateMeta.get(i));

            transMap.replace(txHash, currTrans);
        }

        return transMap;
    }

    /**
     * Union of all transactions containing any of the specified parties.
     * @param result a result of a QueryCriteria vault query
     * @param participants list of participants to filter on
     * @return
     */
    public static Map<SecureHash, TransRecord> filterParticipantsFromQuery(Vault.Page<ContractState> result, List<AbstractParty> participants) {
        List<Vault.StateMetadata> vsm = new ArrayList<>();
        List<StateAndRef<ContractState>> vsr = new ArrayList<>();

        for (int i = 0; i < result.getStates().size(); i++) {
            ContractState currentState = result.getStates().get(i).getState().getData();

            // are any of the participants included in the current state?
            Set<AbstractParty> intersection = participants.stream()
                    .distinct()
                    .filter(currentState.getParticipants()::contains)
                    .collect(Collectors.toSet());

            if (intersection.size() > 0) {
                vsm.add(result.getStatesMetadata().get(i));
                vsr.add(result.getStates().get(i));
            }
        }
        return createTransactionMap(vsm , vsr);
    }

    /**
     * Class TransRecord encapsulates a transaction record consisting of txhash and timeStampe and related state objects.
     */
    public static class TransRecord {
        private List<Pair<ContractState,Vault.StateMetadata>> states;
        private Instant timeStamp;
        private SecureHash txHash;

        void addToStates(ContractState c, Vault.StateMetadata m) {
            states.add(new Pair(c, m));
        }
        public void setTxHash(SecureHash txHash) {
            this.txHash = txHash;
        }

        TransRecord() {
            this.states = new ArrayList<>();
        }
        TransRecord(SecureHash txHash, Instant timeStamp) {
            this();
            this.timeStamp = timeStamp;
            this.txHash = txHash;
        }

        public Instant getTimeStamp() {
            return timeStamp;
        }

        public SecureHash getTxHash() {
            return txHash;
        }

        public List<Pair<ContractState, Vault.StateMetadata>> getStates() {
            return states;
        }

        public String toString() {
            return states.toString() + " " + timeStamp + " " + txHash;
        }
    }

}


