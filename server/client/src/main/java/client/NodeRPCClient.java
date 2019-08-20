package client;

import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.Callable;

import static net.corda.core.utilities.NetworkHostAndPort.parse;

public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private final CordaRPCClient client;
    private final CordaRPCOps proxy;
    private final NodeInfo nodeInfo; // fixed
    private List<String> registeredFlows; // updates
    private Set<String> stateNames; // updates
    private Set<ContractState> statesInVault; //updates

    private Map<String, Callable> cmd;

    private void buildCommandMap(NodeRPCClient node) {
        cmd = new HashMap<>();
        cmd.put("getNodeInfo", node::getNodeInfo);
        cmd.put("getRegisteredFlows", node::getRegisteredFlows);
        cmd.put("getStateNames", node::getStateNames);
        cmd.put("getStatesInVault", node::getStatesInVault);
    }

    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword) {
        this.client = new CordaRPCClient(parse(nodeAddress));
        this.proxy = this.client.start(rpcUsername, rpcPassword).getProxy(); // start the RPC Connection
        this.nodeInfo = proxy.nodeInfo(); // get nodeInfo

        buildCommandMap(this);
        updateNodeData();
        System.out.println("RPC Connection Established");
    }

    // Updates the basic node data (flows, states names, and states in vault
    private void updateNodeData() {
        registeredFlows = proxy.registeredFlows(); // get registered flows

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
    }

    public Object run(String cmd) throws Exception {
        return this.cmd.get(cmd).call();
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

        System.out.println("\n\n DEBUG PRINTS ========");
        System.out.println(client.getNodeInfo());
        System.out.println(client.getRegisteredFlows());
        System.out.println("\n =================");
        System.out.println(client.getStateNames());
        System.out.println(client.getStatesInVault());
        System.out.println("\n =================");
        System.out.println("I'm using the new callable " + client.run("getNodeInfo"));
        System.out.println("I'm using the new callable " + client.run("getRegisteredFlows"));
        //System.out.println("I'm using the new callable " + client.run("Nothing"));



    }
}
