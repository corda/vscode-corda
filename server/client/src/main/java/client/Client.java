package client;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.messaging.CordaRPCOps;
import net.corda.core.utilities.NetworkHostAndPort;


import static net.corda.core.utilities.NetworkHostAndPort.parse;



public class Client{
    public static void main(String[] args) throws InterruptedException {
        // Create an RPC connection to the node.
        if (args.length != 3) throw new IllegalArgumentException("Usage: Client <node address> <rpc username> <rpc password>");
        final NetworkHostAndPort nodeAddress = parse(args[0]);
        final String rpcUsername = args[1];
        final String rpcPassword = args[2];

        final CordaRPCClient client = new CordaRPCClient(nodeAddress);
        final CordaRPCOps proxy = client.start(rpcUsername, rpcPassword).getProxy();
        System.out.println("Client ran successfully!");
       /* proxy.vaultTrack(TokenState.class).getUpdates().toBlocking().subscribe(update -> {
            // Fetch output states, in this case there's always only one output state so grab that directly
            List<TokenState> outputs = update.getProduced().stream().map(stateAndRef -> stateAndRef.getState().getData()).collect(Collectors.toList());
            TokenState token = outputs.get(0);
            System.out.println(token);

            // Notify our back-end of the new state transaction
            updateBackend(token);
        }); */

    }
}