package client;

import client.entities.customExceptions.AuthenticationFailureException;
import client.entities.customExceptions.CommandNotFoundException;
import client.entities.customExceptions.FlowsNotFoundException;
import client.entities.customExceptions.UnrecognisedParameterException;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static client.NodeRPCHelper.*;
import static net.corda.core.node.services.vault.QueryCriteriaUtils.DEFAULT_PAGE_SIZE;
import static net.corda.core.utilities.NetworkHostAndPort.parse;


/**
 * This is a client for RPC interactions with a given node for use with Corda VSCODE
 * extension.
 */
public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private CordaRPCConnection connection;
    private CordaRPCOps proxy;

    private List<String> registeredFlows; // updates
    private Instant initialConnectTime; // time RPCClient is connected
    private String cordappDir; // local directory of the node's corDapp jars

    // maps FQN to class, e.g. bootcamp.InitiateFlow -> (Class)
    private Map<String, Class> registeredFlowClasses;

    // maps FQN to required params, e.g. bootcamp.InitiateFlow -> List<Pair<(Class), "argName">>
    private Map<String, Map<String, List<Pair<Class, String>>>> registeredFlowParams;

    private Map<String, Class> stateNameToClass; // used for userVaultQuery
    private Vault.Page<ContractState> statesAndMeta;

    private Map<String, Callable> cmd; // maps incoming commands to methods

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
     * NodeRPCClient constructor
     * @param nodeAddress is a host and port
     * @param rpcUsername login username
     * @param rpcPassword login password
     * @param cordappDir local directory of Node corDapp jars
     */
    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword, String cordappDir) throws AuthenticationFailureException, FlowsNotFoundException {

        try {
            this.connection = new CordaRPCClient(parse(nodeAddress)).start(rpcUsername, rpcPassword);
            this.proxy = connection.getProxy(); // start the RPC Connection
            this.initialConnectTime = proxy.currentNodeTime(); // set connection time
            this.stateNameToClass = new HashMap<>();
            this.cordappDir = cordappDir;
        }catch(Exception e){
            throw new AuthenticationFailureException("Unable to onnect To The RPC Client at " + nodeAddress
                + ". Start nodes from command palette with Corda Run Nodes.");
        }
        buildCommandMap(this);
        updateNodeData();

    }

    /**
     * Updates the basic node data (flows, states names, and states in vault)
     * also tracks all available flows and their required params
     */
    public void updateNodeData() throws FlowsNotFoundException {
        registeredFlows = proxy.registeredFlows(); // get registered flows

        // build maps for FQN->Class, FQN->List<Class> Params
        Pair<Map, Map> flowClasses_FlowParams = setFlowMaps(cordappDir, this.registeredFlows);
        registeredFlowClasses = flowClasses_FlowParams.getFirst();
        registeredFlowParams = flowClasses_FlowParams.getSecond();

        // perform static query of vault
        statesAndMeta = proxy.vaultQuery(ContractState.class);

        // propagate stateNameToClass map
        statesAndMeta.getStates().iterator().forEachRemaining(s -> {
            stateNameToClass.put(s.getState().getData().getClass().toString().substring(6), s.getState().getData().getClass());
        });
    }

    /**
     * @return vault track DataFeed
     */
    private DataFeed<Vault.Page<ContractState>, Vault.Update<ContractState>> startVaultTrack() {
        return proxy.vaultTrack(ContractState.class);
    }

    /**
     * @return uptime of RPCClient connection
     */
    private Duration getUptime() {
        return Duration.between(initialConnectTime, proxy.currentNodeTime());
    }

    /**
     * @return FQN to required params, e.g. bootcamp.InitiateFlow -> List<Pair<(Class), "argName">>
     */
    private Map<String, Map<String, List<Pair<Class,String>>>> getRegisteredFlowParams() {
        return registeredFlowParams;
    }

    /**
     * @return NodeInfo - network addresses, legal identity, platform version, serial
     */
    private NodeInfo getNodeInfo() {
        return proxy.nodeInfo();
    }

    /**
     * @return All flows (String) runnable on the current Node
     */
    private List<String> getRegisteredFlows() {
        return registeredFlows;
    }

    /**
     * @return Set of the names of all state types currently in the Node's vault
     */
    private Set<String> getStateNames() {
        return stateNameToClass.keySet();
    }

    /**
     * @return all states currently in Node's vault
     */
    private List<StateAndRef<ContractState>> getStatesInVault() { return statesAndMeta.getStates(); }

    /**
     * @return Metadata for all states currently in Node's vault
     */
    private List<Vault.StateMetadata> getStatesMetaInVault() { return statesAndMeta.getStatesMetadata(); }

    /**
     * @param contractState String version of FQN - e.g. "net.corda.yo.state.YoState"
     * @return List of all properties of the state-type
     */
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

    /**
     * @return a mapping from secureHash to a TransRecord object
     */
    private Map<SecureHash, TransRecord> getTransactionMap() {
        return createTransactionMap(getStatesMetaInVault(), getStatesInVault());
    }

    /**
     * startFlow initiates a flow on the node via RPC
     * - params are matched ordered sequences.
     * - each argument is instantiated to its corresponding registeredFlowParam Class
     * type and then added to the finalParams list which is passed to varargs param
     * of the startFlowDynamic call.
     * @param flow FQN of the flow
     * @param args array of args needed for the flow constructor
     * @return
     */
    private FlowHandle startFlow(String flow, String constructor, String[] args) throws UnrecognisedParameterException {
        Class flowClass = registeredFlowClasses.get(flow);
        Map<String, List<Pair<Class,String>>> constructorToParams = registeredFlowParams.get(flow);
        List<Pair<Class,String>> paramTypes = constructorToParams.get(constructor);
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
                        state = getStateFromRef(proxy, stateRef);
                        finalParams.add(new StateAndRef(state, stateRef));
                    } else if (currParam == Long.class) {
                        finalParams.add(Long.valueOf(currArg));
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
     * Main userVaultQuery method for returning advanced searches on the vault states.
     * Todo: add sortAttribute, sortDirection to UI
     * Todo: implement TimeConditions - RELIES on Core 4.3 / Maven Repo is 4.0, bug fix for Comparable<*> Jira https://r3-cev.atlassian.net/browse/CORDA-2782
     * Todo: implement QueryCriteria participant filter - PENDING BUG fix on Corda VaultQueryCriteria Jira #https://r3-cev.atlassian.net/browse/CORDA-3209
     * @param argsIn arguments related to page and sort
     * @param query the predicates of the actual query based on user selection
     * @return Map<SecureHash, TransRecord>
     * @throws Exception
     */
    private Map<SecureHash, TransRecord> userVaultQuery(Map<String, String> argsIn, Map<String, Object> query) throws Exception {

        updateNodeData(); // make sure to update node info for current info; stateNames etc.

        String pageSpecification = argsIn.get("pageSpecification");
        String pageSize = argsIn.get("pageSize");

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

        // BEGIN Create Default arguments ---------
        // Default using MINIMAL restrictions (i.e. Return ALL)
        Vault.StateStatus stateStatus = Vault.StateStatus.ALL;

        Set<Class<ContractState>> contractStateTypes = new HashSet(); // all classes
        for (Class<ContractState> c : stateNameToClass.values()) { contractStateTypes.add(c); }

        List<StateRef> stateRefs = statesAndMeta.getStates().stream().map(v -> v.getRef()).collect(Collectors.toList()); // all staterefs
        List<AbstractParty> notary = proxy.notaryIdentities().stream().map(AbstractParty.class::cast).collect(Collectors.toList()); // all notaries
        QueryCriteria.TimeCondition tc = null; // SHOULD BE ALL
        List<AbstractParty> participants = new ArrayList<>(); // no participant criteria
        //QueryCriteria.TimeCondition tc = null
        Vault.RelevancyStatus rs = Vault.RelevancyStatus.ALL; // all
        // END Create Default arguments ----------

        // Each provided predicate entry will override the corresponding default argument with the new value
        for (Map.Entry<String, Object> entry : query.entrySet()) {
            if (!entry.getValue().equals("")) {
                String predicate = entry.getKey();

                switch (predicate) {
                    // <UNCONSUMED/CONSUMED/ALL>
                    case "stateStatus":
                        stateStatus = Vault.StateStatus.valueOf((String) entry.getValue());
                        break;
                    // ['a','b','c']
                    case "contractStateType":
                        List<String> contractStateNames = (List) entry.getValue();
                        contractStateTypes = new HashSet<>();

                        // fill set with all contract classes corresponding to the names
                        for (String c : contractStateNames) {
                            contractStateTypes.add(stateNameToClass.get(c));
                        }
                        break;
                    // ['{ 'hash': '0x', 'index': '3' }, ... ]
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

        // Build up QueryCriteria
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

        // TEMPORARY FILTER on Participants will only run if some participants are chosen.
        // Participants filtering is Union
        if (participants.size() > 0) {
            return filterParticipantsFromQuery(result, participants);
        } else return createTransactionMap(result.getStatesMetadata(), result.getStates());

    }

    /**
     * runs a given command from the command-map
     * @param cmd
     * @return
     * @throws Exception
     */
    public Object run(String cmd) throws Exception {
        Callable callable = this.cmd.get(cmd);
        if(callable == null){
            throw new CommandNotFoundException(cmd + " is not a registered command");
        }else{
            return callable.call();
        }

    }

    /**
     * Overloaded run method for handling of commands with arguments
     * @param cmd
     * @param args
     * @return
     * @throws Exception
     */
    public Object run(String cmd, Object args) throws Exception {
        // parameterized methods
        switch (cmd) {
            case "startFlow":
                HashMap<String, Object> argMap = (HashMap<String, Object>) args;
                String flow = (String) argMap.get("flow");
                String constructor = (String) argMap.get("constructor");
                List<Object> flowArgs = (ArrayList<Object>) argMap.get("args");
                Object[] flowArgsAsString = flowArgs.toArray();
                String[] argsArray = Arrays.copyOf(flowArgsAsString, flowArgsAsString.length, String[].class);
                return startFlow(flow, constructor, argsArray);

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

}
