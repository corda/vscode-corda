package client;

import com.google.common.collect.ImmutableList;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
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
import java.util.*;
import java.util.concurrent.Callable;

import static net.corda.core.utilities.NetworkHostAndPort.parse;

public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private final CordaRPCOps proxy;
    private final NodeInfo nodeInfo; // fixed
    private List<String> registeredFlows; // updates

    private Map<String, Class> registeredFlowClasses; // maps FQN to class
    private Map<String, String> registeredFlowParams; // maps FQN to required params

    private Set<String> stateNames; // updates
    private Set<ContractState> statesInVault; //updates

    private Map<String, Callable> cmd;

    private static boolean debug = true;

    private void buildCommandMap(NodeRPCClient node) {
        cmd = new HashMap<>();
        cmd.put("getNodeInfo", node::getNodeInfo);
        cmd.put("getRegisteredFlows", node::getRegisteredFlows);
        cmd.put("getStateNames", node::getStateNames);
        cmd.put("getStatesInVault", node::getStatesInVault);
        cmd.put("getRegisteredFlowParams", node::getRegisteredFlowParams);
    }

    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword) {

        CordaRPCClient client = new CordaRPCClient(parse(nodeAddress));
        this.proxy = client.start(rpcUsername, rpcPassword).getProxy(); // start the RPC Connection
        this.nodeInfo = proxy.nodeInfo(); // get nodeInfo

        buildCommandMap(this);
        updateNodeData();

        System.out.println("RPC Connection Established");
    }

    // Updates the basic node data (flows, states names, and states in vault)
    // also tracks all available flows and their required params
    private void updateNodeData() {
        registeredFlows = proxy.registeredFlows(); // get registered flows

        setFlowMaps("bootcamp.workflows-java.jar", registeredFlows);

        // get state names
        List<Vault.StateMetadata> stateMetadata = proxy.vaultQuery(ContractState.class).getStatesMetadata();
        stateNames = new HashSet<>();
        stateMetadata.iterator().forEachRemaining(x -> {
            stateNames.add(x.getContractStateClassName());
        });

        // get states
        List<StateAndRef<ContractState>> vaultStates = proxy.vaultQuery(ContractState.class).getStates();
        statesInVault = new HashSet<>();
        vaultStates.iterator().forEachRemaining(x -> {
            statesInVault.add(x.getState().getData());
        });

        if (debug) {
            // debug
            System.out.println("\n\n");
            System.out.println(registeredFlowClasses);
            System.out.println(registeredFlowParams);
            System.out.println("\n\n");
        }
    }

    private void setFlowMaps(String flowJarPath, List<String> registeredFlows) {
        registeredFlowClasses = new HashMap<>();
        registeredFlowParams = new HashMap<>();

        try {
            File file = new File(flowJarPath);
            URL url = file.toURI().toURL();


            URLClassLoader classLoader = new URLClassLoader(
                    new URL[]{url},
                    ClassLoader.getSystemClassLoader()
            );

            // iterate through all flows and add to flow -> class map
            for (String flow : registeredFlows) {
                Class flowClass = null;

                flowClass = Class.forName(flow, true, classLoader);

                registeredFlowClasses.put(flow, flowClass);
                registeredFlowParams.put(flow, setFlowParams(flowClass).toString());
            }

        } catch (MalformedURLException | ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    // returns params required by a particular flow
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

    public Object run(String cmd) throws Exception {
        return this.cmd.get(cmd).call();
    }

    // Todo: Args can not only be values, but can be OBJECTS
    //  in the latter case, need to instantiate for the user.
    //  - Need to check WHAT are the param types, and search for
    public void run(String cmd, String flow, String[] args) {
        Class flowClass = registeredFlowClasses.get(flow);
        proxy.startFlowDynamic(flowClass, args);
    }

    public Map<String, String> getRegisteredFlowParams() {
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


        System.out.println(client.run("getRegisteredFlowParams"));

        //client.run("", "TokenIssueFlowInititator", "");
//        System.out.println("\n\n DEBUG PRINTS ========");
//        System.out.println(client.getNodeInfo());
//        System.out.println(client.getRegisteredFlows());
//        System.out.println("\n =================");
//        System.out.println(client.getStateNames());
//        System.out.println(client.getStatesInVault());
//        System.out.println("\n =================");
//        System.out.println("I'm using the new callable " + client.run("getNodeInfo"));
//        System.out.println("I'm using the new callable " + client.run("getRegisteredFlows"));
//        //System.out.println("I'm using the new callable " + client.run("Nothing"));
//


    }
}
