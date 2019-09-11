package client;


import client.entities.customExceptions.AuthenticationFailureException;
import client.entities.customExceptions.CommandNotFoundException;
import client.entities.customExceptions.FlowsNotFoundException;
import client.entities.customExceptions.UnrecognisedParameterException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.internal.LinkedTreeMap;
import kotlin.Pair;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.client.rpc.CordaRPCConnection;
import net.corda.core.contracts.*;
import net.corda.core.crypto.SecureHash;
import net.corda.core.identity.AbstractParty;
import net.corda.core.identity.Party;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.messaging.DataFeed;
import net.corda.core.messaging.FlowHandle;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import net.corda.core.node.services.vault.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.json.Json;
import javax.swing.plaf.nimbus.State;
import java.io.File;
import java.lang.reflect.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Callable;

import static net.corda.core.node.services.vault.QueryCriteriaUtils.DEFAULT_PAGE_SIZE;
import static net.corda.core.utilities.NetworkHostAndPort.parse;


/**
 * This is a client for RPC interactions with a given node for use with Corda VSCODE
 * extension.
 */
public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private final CordaRPCClient client;
    private CordaRPCOps proxy;
    private CordaRPCConnection connection;
    private NodeInfo nodeInfo;
    private List<String> registeredFlows; // updates
    private Instant initialConnectTime; // time RPCClient is connected

    private Map<String, Class> registeredFlowClasses; // maps FQN to class
    private Map<String, List<Pair<Class, String>>> registeredFlowParams; // maps FQN to required params

    private Set<String> stateNames; // updates
    private Map<String, Class> contractStateClasses; // used for userVaultQuery
    private Vault.Page<ContractState> statesAndMeta;

    private Map<String, Callable> cmd; // maps incoming commands to methods

    private static boolean debug = false;

    private void buildCommandMap(NodeRPCClient node) {
        cmd = new HashMap<>();
        cmd.put("getNodeInfo", node::getNodeInfo);
        cmd.put("getRegisteredFlows", node::getRegisteredFlows);
        cmd.put("getStateNames", node::getStateNames);
        cmd.put("getStatesInVault", node::getStatesInVault);
        cmd.put("getRegisteredFlowParams", node::getRegisteredFlowParams);
        cmd.put("closeConnection", node::closeConnection);
        cmd.put("getUptime", node::getUptime);
        cmd.put("getStatesMetaInVault", node::getStatesMetaInVault);
        cmd.put("getTransactionMap", node::getTransactionMap);
        cmd.put("startVaultTrack", node::startVaultTrack);
    }

    /**
     * TODO: change hardcoded setFlowMaps param
     * NodeRPCClient constructor
     * @param nodeAddress is a host and port
     * @param rpcUsername login username
     * @param rpcPassword login password
     */
    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword, String cordappDir) throws FlowsNotFoundException, AuthenticationFailureException {

        this.client = new CordaRPCClient(parse(nodeAddress));

        try {
            this.connection = client.start(rpcUsername, rpcPassword);
            this.proxy = connection.getProxy(); // start the RPC Connection
            this.nodeInfo = proxy.nodeInfo(); // get nodeInfo
            this.initialConnectTime = proxy.currentNodeTime(); // set connection time
            this.contractStateClasses = new HashMap<>();
        }catch(Exception e){
            throw new AuthenticationFailureException("Failed To Authenticate To The RPC Client " + nodeAddress);
        }
        buildCommandMap(this);
        updateNodeData();

        // build maps for FQN->Class, FQN->List<Class> Params
        setFlowMaps(cordappDir, this.registeredFlows);

        if (debug) System.out.println("RPC Connection Established");
    }

    /**
     * Updates the basic node data (flows, states names, and states in vault)
     * also tracks all available flows and their required params
     */
    public void updateNodeData() {
        registeredFlows = proxy.registeredFlows(); // get registered flows

        // get state names
        List<Vault.StateMetadata> stateMetadata = proxy.vaultQuery(ContractState.class).getStatesMetadata();
        stateNames = new HashSet<>();
        stateMetadata.iterator().forEachRemaining(x -> {
            stateNames.add(x.getContractStateClassName());
        });

        // static query of vault
        statesAndMeta = proxy.vaultQuery(ContractState.class);
    }

    /**
     * propagates the maps used to track flow classes, constructors and params.
     * @param jarPath full path to the .jar files containing CorDapp flows
     * @param registeredFlows list of registeredFlows on the Node
     */
    private void setFlowMaps(String jarPath, List<String> registeredFlows) throws FlowsNotFoundException {
        registeredFlowClasses = new HashMap<>();
        registeredFlowParams = new HashMap<>();
        File dir = new File(jarPath);
        List<File> jarFiles = new ArrayList<>();

        File[] filesList = dir.listFiles();
        for (File file : filesList) {
            if (file.getName().contains(".jar")) {
                jarFiles.add(file);
                System.out.println(file.getName());
            }
        }

        for (File flowJarFile : jarFiles) {
            // load the jar to extract the class
            try {
                URL url = flowJarFile.toURI().toURL();

                URLClassLoader classLoader = new URLClassLoader(
                        new URL[]{url},
                        getClass().getClassLoader()
                );

                // iterate through all flows and add to flow -> class map
                for (String flow : registeredFlows) {
                    Class flowClass = null;

                    flowClass = Class.forName(flow, true, classLoader);

                    registeredFlowClasses.put(flow, flowClass);
                    System.out.println(flow);
                    System.out.println(flowClass);
                    registeredFlowParams.put(flow, setFlowParams(flowClass));
                }

                System.out.println("flows FOUND in file + " + flowJarFile.toString());
                if(registeredFlowParams.isEmpty()){
                    throw new FlowsNotFoundException("Could not find any flows in the node cordapps");
                }
            } catch (MalformedURLException | ClassNotFoundException e) {
//                e.printStackTrace();
                System.out.println("flows not found in file " + flowJarFile.toString());
            }
        }
    }

    /**
     * setFlowParams - helper for setFlowMaps
     * @param flowClass flow to extract paramTypes from
     * @return list of Classes corresponding to each param of the input flow class
     */
    private List<Pair<Class,String>> setFlowParams(Class flowClass) {
        List<Pair<Class,String>> params = new ArrayList<>();
        List<Constructor> constructors = ImmutableList.copyOf(flowClass.getConstructors());
        for (Constructor c : constructors) {
            List<Parameter> paramNames = ImmutableList.copyOf(c.getParameters());
            for(Parameter param: paramNames){
                if(param.isNamePresent()){
                    params.add(new Pair(param.getType(), param.getName()));
                }else{
                    params.add(new Pair(param.getType(), "UNKNOWN"));
                }

            }

        }


        return params;
    }

    private DataFeed<Vault.Page<ContractState>, Vault.Update<ContractState>> startVaultTrack() {
        return proxy.vaultTrack(ContractState.class);
    }

    /**
     *
     * @return uptime of RPCClient connection
     */
    public Duration getUptime() {
        return Duration.between(initialConnectTime, proxy.currentNodeTime());
    }

    public Map<String, List<Pair<Class,String>>> getRegisteredFlowParams() {
        return registeredFlowParams;
    }

    public NodeInfo getNodeInfo() {
        return nodeInfo;
    }

    public List<String> getRegisteredFlows() {
        return registeredFlows;
    }

    public Set<String> getStateNames() {
        return stateNames;
    }

    public List<StateAndRef<ContractState>> getStatesInVault() { return statesAndMeta.getStates(); }

    public List<Vault.StateMetadata> getStatesMetaInVault() { return statesAndMeta.getStatesMetadata(); }

    // Returns all the properties of a given ContractState
    // params: e.g. "net.corda.yo.state.YoState"
    public List<String> getStateProperties(String contractState) {
        for (StateAndRef<ContractState> sr : getStatesInVault()) {
            // substring 6, removes 'class' prefix from FQN
            if (sr.getState().getData().getClass().toString().substring(6).equals(contractState)) {
                Field[] fields = sr.getState().getData().getClass().getDeclaredFields();
                List<String> properties = new ArrayList<>();

                for (Field f : fields) {
                    properties.add(f.getName());
                }

                return properties;
            }
        }
        return null;
    }

    public Map<SecureHash, TransRecord> getTransactionMap() {
        Map<SecureHash, TransRecord> transMap = new HashMap<>();
        List<Vault.StateMetadata> stateMeta = getStatesMetaInVault();
        List<StateAndRef<ContractState>> states = getStatesInVault();

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
     * startFlow initiates a flow on the node via RPC
     * - args array and registeredFlowParams are matched ordered sequences.
     * each argument is put into form of its corresponding registeredFlowParam Class
     * type and then added to the finalParams list which is passed to varargs param
     * of the startFlowDynamic call.
     * @param flow FQN of the flow
     * @param args array of args needed for the flow constructor
     * @return
     */
    public FlowHandle startFlow(String flow, String[] args) throws UnrecognisedParameterException {
        Class flowClass = registeredFlowClasses.get(flow);
        List<Pair<Class,String>> paramTypes = registeredFlowParams.get(flow);
        String currArg;
        Class currParam;

        List<Object> finalParams = new ArrayList<>();

        if (args.length == paramTypes.size()) {
            for (int i = 0; i < args.length; i++) {
                currArg = args[i];
                currParam = paramTypes.get(i).getFirst();
                try {
                    if (currParam == Party.class) { // PARTY

                        Party p = proxy.partiesFromName(currArg, true).iterator().next();
                        finalParams.add(p);
                    } else if (currArg.equals("true") | currArg.equals("false")) { // BOOLEAN
                        finalParams.add(Boolean.parseBoolean(currArg));
                    } else if (currParam == UniqueIdentifier.class) {
                        finalParams.add(new UniqueIdentifier(null, UUID.fromString(currArg)));
                    } else if (currParam == String.class) {  // STRING
                        finalParams.add(currArg);
                    } else {
                        finalParams.add(Integer.valueOf(currArg)); // INTEGER
                    }
                }catch (Exception e){
                    throw new UnrecognisedParameterException(paramTypes.get(i).getSecond() + " expected a parameter of type " + currParam.toString());
                }
            }
        }
        if(finalParams.toArray().length > 0){
            return proxy.startFlowDynamic(flowClass, finalParams.toArray());
        }else{
            return proxy.startFlowDynamic(flowClass);
        }

    }

    /**
     * Note: softlockingType and constraintsType and constraints not implemented for use
     * with VaultQueryCriteria
     * @param //args: ?pageSpecification (int), ?pageSize (int),
     *            ?sortAttribute (notary, contractStateClassName, recordedTime, consumedTime, lockId, constraintType)
     *            ?sortDirection (ASC, DESC)
     * @param //values JSON string { <predicateType>: "value", ... }
     * @return
     * @throws Exception
     *
     * If no [PageSpecification] is provided, a maximum of [DEFAULT_PAGE_SIZE] results will be returned.
     * API users must specify a [PageSpecification] if they are expecting more than [DEFAULT_PAGE_SIZE] results
     *
     * JSON sample:
     *
     *     "args": {
     *         "pageSpecification":"10",
     *         "pageSize":"10",
     *         "sortAttribute":"notary",
     *         "sortDirection":"ASC"
     *     }
     *
     *     "values": {
     *         "status":"UNCONSUMED",
     *         "contractStateType":"net.corda.core.contracts.ContractState",
     *         "stateRefs":{
     *             "hash":"0x...",
     *             "index":"2"
     *         },
     *         "participants":"[PartyA,PartyB,PartyC]",
     *         "notary":"[PartyA,PartyB,PartyC]",
     *         "timeCondition":{
     *             "type":"RECORDED",
     *             "start":"2018-11-30T18:35:24.00Z",
     *             "end":"2018-11-30T18:35:24.00Z"
     *         },
     *         "relevancyStatus":"RELEVANT"
     *     }
     *
     */
    private Vault.Page<ContractState> userVaultQuery(Map<String, String> argsIn, Map<String, Object> query) throws Exception {

        Gson gson = new GsonBuilder().create();

        String pageSpecification = argsIn.get("pageSpecification");
        String pageSize = argsIn.get("pageSize");
        String sortAttribute = argsIn.get("sortAttribute");
        String sortDirection = argsIn.get("sortDirection");

        // Generate Set of all classes for contractStates
        if (contractStateClasses.isEmpty()) {
            contractStateClasses = new HashMap<>();

            updateNodeData(); // make sure to update node info for stateNames etc.

            // iterate through all stateNames in Vault and map associated classes
            for (String contractState : stateNames) {
                if(!contractStateClasses.containsKey(contractState)) {
                    Iterator<StateAndRef<ContractState>> i = getStatesInVault().iterator();
                    while (i.hasNext()) {
                        // look for first state that matches FQN and add to Map
                        TransactionState<ContractState> cs = i.next().getState();
                        if (cs.getData().getClass().toString().substring(6).equals(contractState)) {
                            contractStateClasses.put(contractState, cs.getData().getClass());
                            break;
                        }
                    }

                }
            }
            // Check for map for integrity
            if (!(stateNames.size() == contractStateClasses.size())) throw new Exception("Error construction stateName:Class map");
        }

        QueryCriteria userCriteria = new QueryCriteria.VaultQueryCriteria();

        for (Map.Entry<String, Object> entry : query.entrySet()) {

            String predicate = entry.getKey();

            switch(predicate) {

                // status input is
                // "<UNCONSUMED/CONSUMED/ALL>"
                case "status":
                    Vault.StateStatus status = Vault.StateStatus.valueOf((String) entry.getValue());

                    userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withStatus(status));
                    break;

                // contractState types input should be FQN of class
                // value = ['a','b','c']
                case "contractStateType":
                    List<String> contractNames = (List) entry.getValue();
                    Set<Class<ContractState>> contractStateTypes = new HashSet<>();

                    // fill class set
                    for(String c : contractNames) {
                        contractStateTypes.add(contractStateClasses.get(c));
                    }
                    // add to QueryCriteria
                    userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withContractStateTypes(contractStateTypes));
                    break;

                // stateRefs input is
                // value = ['{ 'hash': '0x', 'index': '3' }, ... ]
                case "stateRefs":
                    List<Map<String, String>> stateRefInputs = (List<Map<String, String>>) entry.getValue();
                    List<StateRef> stateRefs = new ArrayList<>();

                    // fill stateRefs list
                    for (Map<String, String> sr : stateRefInputs) {
                        String hashIn = sr.get("hash");
                        Integer indexIn = Integer.parseInt(sr.get("index"));

                        SecureHash hash = SecureHash.parse(hashIn);
                        StateRef stateRef = new StateRef(hash, indexIn);

                        stateRefs.add(stateRef);
                    }
                    // add to QueryCriteria
                    userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withStateRefs(stateRefs));
                    break;

                // notary OR participants input is
                // ['PartyA', 'PartyB', ...]
                case "participants":
                case "notary":
                    List<String> parties = (List<String>) entry.getValue();
                    List<AbstractParty> partyList = new ArrayList<>();

                    // fill notary list
                    for (String party : parties) {
                        // grab party from RPCOps and add to list
                        Party p = proxy.partiesFromName(party, true).iterator().next();
                        partyList.add(p);
                    }
                    // add to QueryCriteria
                    if (predicate.equals("notary")) {
                        userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withNotary(partyList));
                    } else { // predicate 'participants'
                        userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withParticipants(partyList));
                    }

                    break;

                // timeCondition input is
                // { 'type':'RECORDED', 'start': <time>, 'end': <time> }
                case "timeCondition":

                    Map<String, String> tcIn = (Map<String, String>) entry.getValue();
                    QueryCriteria.TimeInstantType timeInstantType = QueryCriteria.TimeInstantType.valueOf(tcIn.get("type"));

                    Instant start = Instant.parse(tcIn.get("start"));
                    Instant end = Instant.parse(tcIn.get("end"));

                    ColumnPredicate<Instant> timePred = new ColumnPredicate.Between<>(start, end);
                    QueryCriteria.TimeCondition tc = new QueryCriteria.TimeCondition(timeInstantType, timePred);

                    // add to QueryCriteria
                    userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withTimeCondition(tc));
                    break;

                // relevancyStatus input is
                // "<ALL/RELEVANT/NON_RELEVANT>"
                case "relevancyStatus":
                    String relIn = (String) entry.getValue();
                    Vault.RelevancyStatus rs = Vault.RelevancyStatus.valueOf(relIn);

                    // add to QueryCriteria
                    userCriteria = userCriteria.and(new QueryCriteria.VaultQueryCriteria().withRelevancyStatus(rs));
                    break;


            }
        }

        // PageSpecification default is -1, DEFAULT_PAGE_SIZE
        PageSpecification ps;
        if (pageSpecification != null || pageSize != null) {
            if (pageSpecification == null) {
                ps = new PageSpecification(-1, Integer.parseInt(pageSize));
            } else if (pageSize == null) {
                ps = new PageSpecification(Integer.parseInt(pageSpecification), DEFAULT_PAGE_SIZE);
            } else {
                ps = new PageSpecification(Integer.parseInt(pageSpecification), Integer.parseInt(pageSize));
            }
        } else {
           ps = new PageSpecification(); // default
        }

        // TODO possibly add sort - right now will not use

//        // default sort is DESC on RECORDED TIME
//        SortAttribute.Standard sa;
//        Sort.Direction sd = Sort.Direction.DESC;
//
//        // sortDirection is optional to pair with sortAttribute
//        if (sortAttribute != null) {
//            sa = new SortAttribute.Standard(Sort.VaultStateAttribute.valueOf(sortAttribute));
//            if (sortDirection != null) {
//                sd = Sort.Direction.valueOf(sortDirection);
//            }
//        } else { // default
//            sa = new SortAttribute.Standard(Sort.VaultStateAttribute.RECORDED_TIME);
//        }
//
//        Sort sort = new Sort(Arrays.asList(new Sort.SortColumn(sa, sd))); // build sort

        return proxy.vaultQueryByWithPagingSpec(ContractState.class, userCriteria, ps);
    }

    /**
     * runs a given command from the command-map
     * @param cmd
     * @return
     * @throws Exception
     */
    public Object run(String cmd) throws CommandNotFoundException, Exception {
        Callable callable = this.cmd.get(cmd);
        if(callable == null){
            throw new CommandNotFoundException(cmd + " is not a registered command");
        }else{
            return callable.call();
        }

    }

    public Object run(String cmd, Object args) throws CommandNotFoundException, UnrecognisedParameterException, Exception {

        // parameterized methods
        switch (cmd) {
            case "startFlow":
                HashMap<String, Object> argMap = (HashMap<String, Object>) args;
                String flow = (String) argMap.get("flow");
                List<Object> flowArgs = (ArrayList<Object>) argMap.get("args");
                Object[] flowArgsAsString = flowArgs.toArray();
                String[] argsArray = Arrays.copyOf(flowArgsAsString, flowArgsAsString.length, String[].class);
                return startFlow(flow, argsArray);

            case "getStateProperties":
                return getStateProperties((String) args);
            case "userVaultQuery":
                HashMap<String, Object> queryArgMap = (HashMap<String, Object>) args;
                Map<String, String> queryArgs = (Map<String, String>) queryArgMap.get("args");
                Map<String, Object>  queryValues = (Map<String, Object>) queryArgMap.get("values");
                return userVaultQuery(queryArgs, queryValues);
            default:
                throw new CommandNotFoundException(cmd + " with args is not a registered command");
        }
    }

    /**
     * Closes connection
     * @return null Void object used to convert to callable for storage in cmd map
     */
    public Void closeConnection() {
        connection.notifyServerAndClose();
        return null;
    }

    public class TransRecord {
        private List<Pair<ContractState,Vault.StateMetadata>> states;
        private Instant timeStamp;
        private SecureHash txHash;

        public void addToStates(ContractState c, Vault.StateMetadata m) {
            states.add(new Pair(c, m));
        }
        public void setTxHash(SecureHash txHash) {
            this.txHash = txHash;
        }

        public TransRecord() {
            this.states = new ArrayList<>();
        }
        public TransRecord(SecureHash txHash, Instant timeStamp) {
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

    // main method for debugging
    public static void main(String[] args) throws Exception {

//         NodeRPCClient client = new NodeRPCClient("localhost:10009","default","default", "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\Projects\\samples\\reference-states\\workflows-kotlin\\build\\nodes\\IOUPartyA\\cordapps");

  //       String s = "{\"flow\":\"com.example.flow.IOUIssueFlow$Initiator\",\"args\":[\"5\",\"blah\",\"SanctionsBody\"]}";
   //      HashMap<String, String> content = new ObjectMapper().readValue(s, HashMap.class);

//
    //     FlowHandle corda = (FlowHandle) client.run("startFlow", content);
//        corda.getReturnValue().then(CordaFuture ->{
//            System.out.println("Finished");
//            System.out.println(CordaFuture.hashCode());
//            return CordaFuture;
//        });
//
//        while(true){
//
//        }

      //  NodeRPCClient client = new NodeRPCClient("localhost:10005","default","default", "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\Projects\\samples\\reference-states\\workflows-kotlin\\build\\nodes\\IOUPartyA\\cordapps");
      //  client.run("getTransctionMap");

        //client.setFlowMaps(".", client.getRegisteredFlows());
        //System.out.println(client.run("getStatesInVault"));
        //List<StateAndRef<ContractState>> states = (List<StateAndRef<ContractState>>) client.run("getStatesInVault");
        //List<Vault.StateMetadata> stateMeta = (List<Vault.StateMetadata>) client.run("getStatesMetaInVault");

//        Gson gson = new GsonBuilder().create();
//        String s =
//                " {\n" +
//                        " \t\"args\": {\n" +
////                        " \t\t\"pageSpecification\": \"1\",\n" +
////                        " \t\t\"pageSize\": \"10\",\n" +
//                        " \t\t\"sortAttribute\": \"NOTARY_NAME\",\n" +
//                        " \t\t\"sortDirection\": \"ASC\"\n" +
//                        " \t},\n" +
//                        " \t\"values\": {\n" +
////                        " \t\t\"contractStateType\": [\"net.corda.core.contracts.ContractState\"],\n" +
//                        " \t\t\"stateRefs\": [{\n" +
//                        " \t\t\t\"hash\": \"CABC3C3F980BDA8F20D5F06EFCA1A2516ADB248AD05529405D89D76C4C088E37\",\n" +
//                        " \t\t\t\"index\": \"0\"\n" +
//                        " \t\t}]\n" +
//                        " \t\t\"participants\": [\"PartyB\"]" +
                        //" \t\t\"notary\": [\"Notary\"],\n" +
//                        " \t\t\"timeCondition\": {\n" +
//                        " \t\t\t\"type\": \"RECORDED\",\n" +
//                        " \t\t\t\"start\": \"2018-11-30T18:35:24.00Z\",\n" +
//                        " \t\t\t\"end\": \"2018-11-30T18:35:24.00Z\"\n" +
//                        " \t\t},\n" +
                        //" \t\t\"relevancyStatus\": \"RELEVANT\"\n" +
//                        " \t}\n" +
//                        "\n" +
//                        " }"
//        ;

        //System.out.println("HERE is \n" +

  //      Map<String, Object> in = gson.fromJson(s, HashMap.class);
//        Map a = (Map) in.get("args");
//        Map b = (Map) in.get("values");
//        System.out.println(b);
//        System.out.println(b.getClass());
//        System.out.println(a.get("pageSize").getClass());
//        // ARRAYLIST
//        System.out.println(b.get("stateRefs").getClass());
//        // String - then parse to String[]
//        System.out.println(b.get("participants").getClass());
//        // Map<String, String>
//        System.out.println(b.get("timeCondition").getClass());



//        Vault.Page<ContractState> result = (Vault.Page<ContractState>) client.run("userVaultQuery", in);
//
//        System.out.println(result.getStates());
//        System.out.println("\n\n\n" + result.getTotalStatesAvailable());
        //System.out.println("\n\n\n" + result.getTotalStatesAvailable());


//        Set<Map.Entry<SecureHash, TransRecord>> mp = client.getTransactionMap().entrySet();
//        for (Map.Entry<SecureHash, TransRecord> m : mp) {
//            System.out.println(m.getValue());
//        }
        //Map<SecureHash, TransRecord> t = (Map<SecureHash, TransRecord>) client.run("getTransactionMap");
        //System.out.println(t);

    }
}
