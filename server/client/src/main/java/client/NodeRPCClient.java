package client;

import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static net.corda.core.utilities.NetworkHostAndPort.parse;

public class NodeRPCClient {
    private static final Logger logger = LoggerFactory.getLogger(NodeRPCClient.class);

    private final CordaRPCClient client;
    private final CordaRPCOps proxy;
    private final NodeInfo nodeInfo; // fixed
    private List<String> registeredFlows; // updates
    private Set<String> stateNames; // updates
    private Set<ContractState> stateClasses; //updates


    public NodeRPCClient(String nodeAddress, String rpcUsername, String rpcPassword) {
        this.client = new CordaRPCClient(parse(nodeAddress));
        this.proxy = this.client.start(rpcUsername, rpcPassword).getProxy(); // start the RPC Connection
        this.nodeInfo = proxy.nodeInfo(); // get nodeInfo
        updateNodeData();
    }

    // Updates the basic node information
    private void updateNodeData() {
        registeredFlows = proxy.registeredFlows(); // get registered flows

        // get state names
        List<Vault.StateMetadata> stateMetadata = proxy.vaultQuery(ContractState.class).getStatesMetadata();
        stateNames = new HashSet<>();
        stateMetadata.iterator().forEachRemaining(x -> {
            stateNames.add(x.getContractStateClassName());
        });

        // get state classes
        List<StateAndRef<ContractState>> vaultStates = proxy.vaultQuery(ContractState.class).getStates();
        stateClasses = new HashSet<>();
        vaultStates.iterator().forEachRemaining(x -> {
            stateClasses.add(x.getState().getData());
        });
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

    public Set<ContractState> getStateClasses() {
        return stateClasses;
    }

    // main method for debugging
    public static void main(String[] args) {
        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test");

        System.out.println("\n\n DEBUG PRINTS ========");
        System.out.println(client.getNodeInfo());
        System.out.println(client.getRegisteredFlows());
        System.out.println("\n =================");
        System.out.println(client.getStateNames());
        System.out.println(client.getStateClasses());

    }
}
