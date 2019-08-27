package client;

import com.google.common.collect.ImmutableList;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.client.rpc.CordaRPCConnection;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.contracts.UniqueIdentifier;
import net.corda.core.identity.Party;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.lang.reflect.Constructor;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Callable;

import static net.corda.core.utilities.NetworkHostAndPort.parse;


/**
 * This is a client for RPC interactions with a given node for use with Corda VSCODE
 * extension.
 */
public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private final CordaRPCClient client;
    private final CordaRPCOps proxy;
    private final CordaRPCConnection connection;
    private final NodeInfo nodeInfo;
    private List<String> registeredFlows; // updates
    private Instant initialConnectTime; // time RPCClient is connected

    private String flowsJarPath; // path containing .jar with flows
    private Map<String, Class> registeredFlowClasses; // maps FQN to class
    private Map<String, List<Class>> registeredFlowParams; // maps FQN to required params

    private Set<String> stateNames; // updates
    private Set<ContractState> statesInVault; //updates

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
    }

    /**
     * TODO: change hardcoded setFlowMaps param
     * NodeRPCClient constructor
     * @param nodeAddress is a host and port
     * @param rpcUsername login username
     * @param rpcPassword login password
     */
    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword) {

        this.client = new CordaRPCClient(parse(nodeAddress));
        this.connection = client.start(rpcUsername,rpcPassword);
        this.proxy = connection.getProxy(); // start the RPC Connection
        this.nodeInfo = proxy.nodeInfo(); // get nodeInfo
        this.initialConnectTime = proxy.currentNodeTime(); // set connection time

        buildCommandMap(this);
        updateNodeData();

        // build maps for FQN->Class, FQN->List<Class> Params
        setFlowMaps("/Users/anthonynixon/Repo/Clones/Freya_JAVA-samples/yo-cordapp/workflows-java/build/nodes/PartyB/cordapps",
                    this.registeredFlows); // TESTING hardcoded dir

        if (debug) System.out.println("RPC Connection Established");
    }

    /**
     *
     * @return uptime of RPCClient connection
     */
    public Duration getUptime() {
        return Duration.between(initialConnectTime, proxy.currentNodeTime());
    }

    /**
     * Updates the basic node data (flows, states names, and states in vault)
     * also tracks all available flows and their required params
     */
    private void updateNodeData() {
        registeredFlows = proxy.registeredFlows(); // get registered flows

        // get state names
        List<Vault.StateMetadata> stateMetadata = proxy.vaultQuery(ContractState.class).getStatesMetadata();
        stateNames = new HashSet<>();
        stateMetadata.iterator().forEachRemaining(x -> {
            stateNames.add(x.getContractStateClassName());
        });

        // get state objects
        List<StateAndRef<ContractState>> vaultStates = proxy.vaultQuery(ContractState.class).getStates();
        statesInVault = new HashSet<>();
        vaultStates.iterator().forEachRemaining(x -> {
            statesInVault.add(x.getState().getData());
        });

    }

    /**
     * Todo: GET JAR from node cordapp directory instead of build dir?
     *  - Handle MULTIPLE JARS
     * propagates the maps used to track flow classes, constructors and params.
     * @param jarPath full path to the .jar files containing CorDapp flows
     * @param registeredFlows list of registeredFlows on the Node
     */
    private void setFlowMaps(String jarPath, List<String> registeredFlows) {
        this.flowsJarPath = jarPath;

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
                    registeredFlowParams.put(flow, setFlowParams(flowClass));
                }

                System.out.println("flows FOUND in file + " + flowJarFile.toString());
            } catch (MalformedURLException | ClassNotFoundException e) {
//                e.printStackTrace();
                System.out.println("flows not found in file " + flowJarFile.toString());
            }
        }
    }

    /**
     * setFlowParams
     * @param flowClass flow to extract paramTypes from
     * @return list of Classes corresponding to each param of the input flow class
     */
    private List<Class> setFlowParams(Class flowClass) {
        List<Class> params = new ArrayList<>();
        List<Constructor> constructors = ImmutableList.copyOf(flowClass.getConstructors());
        for (Constructor c : constructors) {
            List<Class> paramTypes = ImmutableList.copyOf(c.getParameterTypes());
            for (Class param : paramTypes) {
                params.add(param);
            }
        }

        return params;
    }

    /**
     * runs a given command from the command-map
     * @param cmd
     * @return
     * @throws Exception
     */
    public Object run(String cmd) throws Exception {
        return this.cmd.get(cmd).call();
    }
    public void run(String flow, String[] args) {
        startFlow(flow, args);
    }

    /**
     * startFlow initiates a flow on the node via RPC
     * - args array and registeredFlowParams are matched ordered sequences.
     * each argument is put into form of its corresponding registeredFlowParam Class
     * type and then added to the finalParams list which is passed to varargs param
     * of the startFlowDynamic call.
     * @param flow FQN of the flow
     * @param args array of args needed for the flow constructor
     */
    public void startFlow(String flow, String[] args) {
        Class flowClass = registeredFlowClasses.get(flow);
        List<Class> paramTypes = registeredFlowParams.get(flow);
        String currArg;
        Class currParam;

        List<Object> finalParams = new ArrayList<>();

        if (args.length == paramTypes.size()) {
            for (int i = 0; i < args.length; i++) {
                currArg = args[i];
                currParam = paramTypes.get(i);

                if (currParam == Party.class) { // PARTY
                    Party p = proxy.partiesFromName(currArg, true).iterator().next();
                    finalParams.add(p);
                } else if (currArg.equals("true") | currArg.equals("false")) { // BOOLEAN
                    finalParams.add(Boolean.parseBoolean(currArg));
                } else if (currParam == UniqueIdentifier.class) {
                    finalParams.add(new UniqueIdentifier(null, UUID.fromString(currArg)));
                } else if(currParam == String.class) {  // STRING
                    finalParams.add(currArg);
                } else {
                    finalParams.add(Integer.valueOf(currArg)); // INTEGER
                }
            }
        }

        proxy.startFlowDynamic(flowClass, finalParams.toArray());
    }

    /**
     * Closes connection
     * @return null Void object used to convert to callable for storage in cmd map
     */
    public Void closeConnection() {
        connection.notifyServerAndClose();
        return null;
    }

    public Map<String, List<Class>> getRegisteredFlowParams() {
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

    public Set<ContractState> getStatesInVault() {
        return statesInVault;
    }

    // main method for debugging
    public static void main(String[] args) throws Exception {

        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test");
        client.setFlowMaps(".", client.getRegisteredFlows());
        System.out.println(client.run("getRegisteredFlowParams"));
        //System.out.println(client.getRegisteredFlowParams().get("bootcamp.flows.TokenIssueFlowInitiator").get(1).getClass());
        System.out.println(client.run("getNodeInfo"));
        //client.run("bootcamp.flows.TokenIssueFlowInitiator", new String[]{"PartyA","9888999"});

    }
}
