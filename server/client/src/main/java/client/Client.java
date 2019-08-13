package client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import net.corda.core.utilities.NetworkHostAndPort;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static net.corda.core.utilities.NetworkHostAndPort.parse;
import static org.apache.logging.log4j.message.MapMessage.MapFormat.JSON;


public class Client{

    private static final Logger logger = LoggerFactory.getLogger(Client.class);

    static String updateBackend(ContractState state) {
        String json = getRequestJson(state, "");
        String url = "http://localhost:8080/updateState";

        MediaType JSON = okhttp3.MediaType.parse("application/json; charset=utf-8");
        OkHttpClient client = new OkHttpClient();
        RequestBody body = RequestBody.create(JSON, json); // reversed args for Java
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
        try {
            Response response = client.newCall(request).execute();
            if (!response.isSuccessful()) {
                // repeat call
            }
            System.out.println(response.body().toString());
            return response.body().string();
        } catch (IOException e) {
            String s = "ERROR";
            return s;
        }
    }

    // Convert the pertinent State object fields into a json string
    static String getRequestJson(ContractState state, String error) {
        Map<String, String> map = new HashMap<String, String>();
        map.put(state.getClass().getName(), state.toString());
        //map.put("issuer", tokenState.getIssuer().toString());
        //map.put("owner", tokenState.getOwner().toString());
        //map.put("amount", String.valueOf((tokenState.getAmount())));
        //map.put("linearId", iouState.getLinearId().toString());
        //map.put("error", error);
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String json = objectMapper.writeValueAsString(map);
            System.out.println(json); // TESTING
            return json;
        } catch (JsonProcessingException e) {
            return "";
        }
    }

    public static void main(String[] args) throws InterruptedException {
        // Create an RPC connection to the node.
        if (args.length != 3) throw new IllegalArgumentException("Usage: Client <node address> <rpc username> <rpc password>");
        final NetworkHostAndPort nodeAddress = parse(args[0]);
        final String rpcUsername = args[1];
        final String rpcPassword = args[2];

        final CordaRPCClient client = new CordaRPCClient(nodeAddress);
        final CordaRPCOps proxy = client.start(rpcUsername, rpcPassword).getProxy();

        // TODO check for heartbeat alive response.
        OkHttpClient okClient = new OkHttpClient();

         //WAIT FOR SERVER to come up.
        Request req = new Request.Builder().url("http://localhost:8080/alive").get().build();
        Response res;
        while (true) {
            try {
                res = okClient.newCall(req).execute();
                if(res.isSuccessful()) break;
            } catch (IOException e) { }
        }

        // get node info
        NodeInfo nodeInfo = proxy.nodeInfo();

        // get flow list
        List<String> flows = proxy.registeredFlows();

        // get state names
        List<Vault.StateMetadata> stateMetadata = proxy.vaultQuery(ContractState.class).getStatesMetadata();
        Set<String> stateNames = getStateNames(stateMetadata);

        // get state classes
        List<StateAndRef<ContractState>> vaultStates = proxy.vaultQuery(ContractState.class).getStates();
        Set<ContractState> stateClasses = getStateClasses(vaultStates);

        // debugging prints
        System.out.println("\n\n\n =====================================");
        System.out.println("\nFlow Listing: " + flows);
        System.out.println("NODE INFO ++++++ " + nodeInfo);
        System.out.println("State Names: " + stateNames);
        System.out.println("State Classes: " + stateClasses);
        System.out.println("\n");

        // Query what's already in the Vault
        loadVaultHistory(proxy);
        // Start Vault Tracking for ALL states on node
        startVaultTrackingStates(proxy, stateClasses);

        System.out.println("\nClient ran successfully!");

    }

    private static void loadVaultHistory(CordaRPCOps proxy) {
        Vault.Page<ContractState> query = proxy.vaultQuery(ContractState.class);
        for (StateAndRef<ContractState> s : query.getStates()) {
            updateBackend(s.getState().getData());
        }
    }

    // Starts vault tracking for every state existing on the node
    // params: proxy, Set of ContractStates
    private static void startVaultTrackingStates(CordaRPCOps proxy, Set<ContractState> stateClasses) {
        for (ContractState stateClass : stateClasses) {
            setVaultTrack(proxy, stateClass);
        }
    }

    // Sets a vault track for a particular state
    // params: proxy, the contractState to be tracked
    private static void setVaultTrack(CordaRPCOps proxy, ContractState contractState) {
        System.out.println("==== I'm RUNNING!!!! ");
        proxy.vaultTrack(contractState.getClass()).getUpdates().toBlocking().subscribe(update -> {
            // Fetch output states, in this case there's always only one output state so grab that directly
            List<ContractState> outputs = update.getProduced().stream().map(stateAndRef -> stateAndRef.getState().getData()).collect(Collectors.toList());
            ContractState state = outputs.get(0);
            System.out.println("hey!");

            updateBackend(state);
        });
    }

    // returns the names of all states in the connected nodes vault.
    private static Set<String> getStateNames(List<Vault.StateMetadata> stateMetadata) {
        Set<String> stateNames = new HashSet<>();

        for (Vault.StateMetadata m : stateMetadata) {
            stateNames.add(m.getContractStateClassName());
        }
        return stateNames;
    }

    // returns a set of all contract states in the connected nodes vault.
    private static Set<ContractState> getStateClasses(List<StateAndRef<ContractState>> vaultStates) {
        Set<ContractState> stateClasses = new HashSet<>();

        for (StateAndRef<ContractState> sr : vaultStates) {
            stateClasses.add(sr.getState().getData());
        }
        return stateClasses;
    }

}