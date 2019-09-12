package client;

import client.entities.customExceptions.AuthenticationFailureException;
import client.entities.customExceptions.CommandNotFoundException;
import client.entities.customExceptions.FlowsNotFoundException;
import client.entities.customExceptions.UnrecognisedParameterException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.collect.ImmutableList;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
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
import net.corda.core.node.services.vault.ColumnPredicate;
import net.corda.core.node.services.vault.PageSpecification;
import net.corda.core.node.services.vault.QueryCriteria;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.lang.reflect.*;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    //private Set<String> stateNames; // updates
    private Map<String, Class> stateNameToClass; // used for userVaultQuery
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
            this.connection = client.start(rpcUsername,rpcPassword);
            this.proxy = connection.getProxy(); // start the RPC Connection
            this.nodeInfo = proxy.nodeInfo(); // get nodeInfo
            this.initialConnectTime = proxy.currentNodeTime(); // set connection time
            this.stateNameToClass = new HashMap<>();
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

        // static query of vault
        statesAndMeta = proxy.vaultQuery(ContractState.class);

        // propagate stateNameToClass map
        statesAndMeta.getStates().iterator().forEachRemaining(s -> {
            stateNameToClass.put(s.getState().getData().getClass().toString().substring(6), s.getState().getData().getClass());
        });
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

        // First add all of the necessary jar files to the class path so that they are available when loading classes
        URLClassLoader sysClassLoader = (URLClassLoader) getClass().getClassLoader();
        Method method = null;
        try {
            method = URLClassLoader.class.getDeclaredMethod("addURL", URL.class);
            for(File flowJarFile : jarFiles){
                URL url = flowJarFile.toURI().toURL();
                method.setAccessible(true);
                method.invoke(sysClassLoader, url);
                System.out.println("Loaded URL " );
            }
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
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
    private Duration getUptime() {
        return Duration.between(initialConnectTime, proxy.currentNodeTime());
    }

    private Map<String, List<Pair<Class,String>>> getRegisteredFlowParams() {
        return registeredFlowParams;
    }

    private NodeInfo getNodeInfo() {
        return nodeInfo;
    }

    private List<String> getRegisteredFlows() {
        return registeredFlows;
    }

    private Set<String> getStateNames() {
        return stateNameToClass.keySet();
    }

    private TransactionState getStateFromRef(StateRef stateRef){
        QueryCriteria stateRefCriteria = new QueryCriteria.VaultQueryCriteria()
                .withStateRefs(Arrays.asList(stateRef));
        Vault.Page<ContractState> result = proxy.vaultQueryByCriteria(stateRefCriteria, ContractState.class);
        return result.getStates().get(0).getState();
    }

    private List<StateAndRef<ContractState>> getStatesInVault() { return statesAndMeta.getStates(); }

    private List<Vault.StateMetadata> getStatesMetaInVault() { return statesAndMeta.getStatesMetadata(); }

    // Returns all the properties of a given ContractState
    // params: e.g. "net.corda.yo.state.YoState"
    private List<String> getStateProperties(String contractState) {
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

    private Map<SecureHash, TransRecord> createTransactionMap(List<Vault.StateMetadata> stateMeta, List<StateAndRef<ContractState>> states) {
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

    private Map<SecureHash, TransRecord> getTransactionMap() {
        return createTransactionMap(getStatesMetaInVault(), getStatesInVault());
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
    private FlowHandle startFlow(String flow, String[] args) throws UnrecognisedParameterException {
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
                    } else if (currParam == Boolean.class){//currArg.equals("true") | currArg.equals("false")) { // BOOLEAN

                        finalParams.add(Boolean.parseBoolean(currArg.toLowerCase()));
                    } else if (currParam == UniqueIdentifier.class) {
                        finalParams.add(new UniqueIdentifier(null, UUID.fromString(currArg)));
                    } else if (currParam == String.class) {  // STRING
                        finalParams.add(currArg);
                    }else if (currParam == LocalDate.class) {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yy");
                        LocalDate localDate = LocalDate.parse(currArg, formatter);
                        finalParams.add(localDate);
                    }else if (currParam == StateAndRef.class){
                        Pattern pattern = Pattern.compile("(.{64})\\((\\d*)\\)");
                        Matcher matcher = pattern.matcher(currArg);
                        TransactionState state;
                        matcher.find();
                        SecureHash txhash = SecureHash.parse(matcher.group(1));
                        int index = Integer.parseInt(matcher.group(2));
                        StateRef stateRef = new StateRef(txhash, index);
                        state = getStateFromRef(stateRef);
                        finalParams.add(new StateAndRef(state, stateRef));
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
    private Map<SecureHash, TransRecord> userVaultQuery(Map<String, String> argsIn, Map<String, Object> query) throws Exception {

        Gson gson = new GsonBuilder().create();

        String pageSpecification = argsIn.get("pageSpecification");
        String pageSize = argsIn.get("pageSize");
        String sortAttribute = argsIn.get("sortAttribute");
        String sortDirection = argsIn.get("sortDirection");

        updateNodeData(); // make sure to update node info for stateNames etc.

        // Default arguments for Query with least restrictive query
        Vault.StateStatus stateStatus = Vault.StateStatus.ALL;

        Set<Class<ContractState>> contractStateTypes = new HashSet(); // all classes
        for (Class<ContractState> c : stateNameToClass.values()) { contractStateTypes.add(c); }

        List<StateRef> stateRefs = statesAndMeta.getStates().stream().map(v -> v.getRef()).collect(Collectors.toList()); // all staterefs
        List<AbstractParty> notary = proxy.notaryIdentities().stream().map(AbstractParty.class::cast).collect(Collectors.toList()); // all notaries
        QueryCriteria.TimeCondition tc = null; // SHOULD BE ALL
        List<AbstractParty> participants = new ArrayList<>(); // no participant criteria
        //QueryCriteria.TimeCondition tc = null
        Vault.RelevancyStatus rs = Vault.RelevancyStatus.ALL; // all

        for (Map.Entry<String, Object> entry : query.entrySet()) {
            if (!entry.getValue().equals("")) {
                String predicate = entry.getKey();

                switch (predicate) {

                    // value = <UNCONSUMED/CONSUMED/ALL>
                    case "stateStatus":
                        stateStatus = Vault.StateStatus.valueOf((String) entry.getValue());
                        break;

                    // value = ['a','b','c']
                    case "contractStateType":
                        List<String> contractNames = (List) entry.getValue();
                        contractStateTypes = new HashSet<>();

                        // fill class set
                        for (String c : contractNames) {
                            contractStateTypes.add(stateNameToClass.get(c));
                        }
                        break;

                    // value = ['{ 'hash': '0x', 'index': '3' }, ... ]
                    case "stateRefs":
                        List<Map<String, String>> stateRefInputs = (List<Map<String, String>>) entry.getValue();
                        stateRefs = new ArrayList<>();

                        // fill stateRefs list
                        for (Map<String, String> sr : stateRefInputs) {
                            String hashIn = sr.get("hash");
                            Integer indexIn = Integer.parseInt(sr.get("index"));

                            SecureHash hash = SecureHash.parse(hashIn);
                            StateRef stateRef = new StateRef(hash, indexIn);

                            stateRefs.add(stateRef);
                        }
                        break;

                    // value = ['PartyA', 'PartyB', ...]
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
                            notary = partyList;
                        } else { // predicate 'participants'
                            participants = partyList;
                        }

                        break;

                    // value = { 'type':'<RECORDED/CONSUMED>', 'start': <time>, 'end': <time> }
                    case "timeCondition":

                        Map<String, String> tcIn = (Map<String, String>) entry.getValue();
                        QueryCriteria.TimeInstantType timeInstantType = QueryCriteria.TimeInstantType.valueOf(tcIn.get("type"));

                        Instant start = Instant.parse(tcIn.get("start"));
                        Instant end = Instant.parse(tcIn.get("end"));

                        ColumnPredicate<Instant> timePred = new ColumnPredicate.Between<>(start, end);
                        tc = new QueryCriteria.TimeCondition(timeInstantType, timePred);

                        break;

                    // value = ALL/RELEVANT/NON_RELEVANT
                    case "relevancyStatus":
                        String relIn = (String) entry.getValue();
                        rs = Vault.RelevancyStatus.valueOf(relIn);

                        break;


                }
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

//        TODO possibly add sort - right now will not use
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

        QueryCriteria userCriteria = new QueryCriteria.VaultQueryCriteria()
                .withStatus(stateStatus)
                .withContractStateTypes(contractStateTypes)
                .withStateRefs(stateRefs)
                .withNotary(notary)
                //.withTimeCondition(tc) - RELIES on Core 4.3 / Maven Repo is 4.0, bug fix for Comparable<*> Jira https://r3-cev.atlassian.net/browse/CORDA-2782
                //.withParticipants(Arrays.asList(p)); PENDING BUG fix on Corda VaultQueryCriteria Jira #https://r3-cev.atlassian.net/browse/CORDA-3209
                .withRelevancyStatus(rs);

        System.out.println("Query is HERE : " + userCriteria.toString());
        Vault.Page<ContractState> result = proxy.vaultQueryByWithPagingSpec(ContractState.class, userCriteria, ps);

        // TEMPORARY FILTER on Participants only run if some participants are chosen.
        // Participants filtering is Union
        if (participants.size() > 0) {
            List<Vault.StateMetadata> vsm = new ArrayList<>();
            List<StateAndRef<ContractState>> vsr = new ArrayList<>();

            for (int i = 0; i < result.getStates().size(); i++) {
                ContractState currentState = result.getStates().get(i).getState().getData();

                //if (new HashSet<>(participants).equals(new HashSet<>(currentState.getParticipants()))) {
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
        } else return createTransactionMap(result.getStatesMetadata(), result.getStates());

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

    // main method for debugging
    public static void main(String[] args) throws Exception {


//         NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test", "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\Projects\\samples\\negotiation-cordapp\\workflows-java\\build\\nodes\\PartyB\\cordapps");
//
//         String s = "{\"flow\":\"net.corda.core.flows.ContractUpgradeFlow$Initiate\",\"args\":[\"0FDE61A6AF51FFE8B373C9BA0580E77483B8BD59C419EF8F6237AB83F68374F7(0)\",\"MegaCorp 1\"]}";
//         HashMap<String, String> content = new ObjectMapper().readValue(s, HashMap.class);
//
//
//         FlowHandle corda = (FlowHandle) client.run("startFlow", content);

//         NodeRPCClient client = new NodeRPCClient("localhost:10009","default","default", "C:\\Users\\Freya Sheer Hardwick\\Documents\\Developer\\Projects\\samples\\reference-states\\workflows-kotlin\\build\\nodes\\IOUPartyA\\cordapps");
        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test", "/Users/anthonynixon/Repo/TEST/bootcamp-cordapp/workflows-kotlin/build/nodes/PartyB/cordapps");

        Gson gson = new GsonBuilder().create();

        String t = "{\"args\":{\"sortAttribute\":\"NOTARY_NAME\",\"sortDirection\":\"ASC\"},\"values\":{\"stateStatus\":\"ALL\",\"contractStateType\":[\"bootcamp.states.TokenState\"],\"stateRefs\":" +
                "[{ \"hash\":\"3CF0273A4C29374BC0E53F516A177A41B9DA62AC331F373D542833CDC40C86D9\",\"index\":\"0\"}] ,\"notary\":\"\",\"timeCondition\":\"\",\"relevancyStatus\":\"ALL\",\"participants\":[\"PartyA\",\"PartyB\"]}}";


        String u = "{\"args\":{\"sortAttribute\":\"NOTARY_NAME\",\"sortDirection\":\"ASC\"},\"" +
                "values\":{\"" +
                "stateStatus\":\"ALL\",\"" +
                "contractStateType\":\"\",\"" +
                "stateRefs\":\"\",\"" +
                "notary\":\"\",\"" +
                "timeCondition\":" +
                "{\"type\":\"RECORDED\",\"start\":\"2019-09-10T08:26:20.637Z\",\"end\":\"2019-09-12T08:26:20.637Z\"}," +
                "relevancyStatus\":\"ALL\",\"" +
                "participants\":\"\"}}";

        String v = "{\"args\":{\"sortAttribute\":\"NOTARY_NAME\",\"sortDirection\":\"ASC\"},\"values\":{\"stateStatus\":\"CONSUMED\",\"contractStateType\":\"\",\"stateRefs\":\"\",\"notary\":\"\",\"timeCondition\":\"\",\"relevancyStatus\":\"ALL\",\"participants\":\"\"}}";

        String k = "{\"args\":{\"sortAttribute\":\"NOTARY_NAME\",\"sortDirection\":\"ASC\"},\"values\":{\"stateStatus\":\"UNCONSUMED\",\"contractStateType\":\"\",\"stateRefs\":\"\",\"notary\":\"\",\"timeCondition\":\"\",\"relevancyStatus\":\"ALL\",\"participants\":[\"PartyB\",\"PartyA\"]}}";

        String z = "{\"args\":{\"sortAttribute\":\"NOTARY_NAME\",\"sortDirection\":\"ASC\"},\"values\":{\"stateStatus\":\"ALL\",\"contractStateType\":\"\",\"stateRefs\":\"\",\"notary\":\"\",\"timeCondition\":{\"type\":\"RECORDED\",\"start\":\"2017-05-24T10:30:30.00Z\",\"end\":\"2019-05-25T10:30:30.00Z\"},\"relevancyStatus\":\"ALL\",\"participants\":\"\"}}";

        Map<String, Object> uu = new ObjectMapper().readValue(z, HashMap.class);
        Map<SecureHash, TransRecord> result = (Map<SecureHash, TransRecord>) client.run("userVaultQuery", uu);

        System.out.println("\n\n\n\nHere is the result : \n" + result);
        System.out.println("\n\n Quantity returned : " + result.size());

    }
}
