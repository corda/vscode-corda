import client.NodeRPCClient;
import client.boundary.ClientWebSocket;
import client.entities.customExceptions.CommandNotFoundException;
import client.entities.customExceptions.UnrecognisedParameterException;

/**
 *         cmd.put("getStateNames", node::getStateNames);
 *         cmd.put("getStatesInVault", node::getStatesInVault);
 *         cmd.put("getRegisteredFlowParams", node::getRegisteredFlowParams);
 *         cmd.put("closeConnection", node::closeConnection); // RETURNS NULL
 *         cmd.put("getUptime", node::getUptime);
 */

public class ObjEncoderTestDriver {
    static NodeRPCClient client;

    public static void main(String[] args) throws Exception {

        client = new NodeRPCClient("localhost:10009", "user1", "test", "/Users/anthonynixon/Repo/Clones/Freya_JAVA-samples/yo-cordapp/workflows-java/build/nodes/PartyB/cordapps");
        System.out.println("\n\n");

        //runTest("getTransactionMap");
        //runTest("getNodeInfo");
        //runTest("getRegisteredFlowParams");
        runParamTest("getStateProperties", "net.corda.yo.state.YoState");
    }

    private static void runTest(String cmd) throws Exception {
        Object obj = client.run(cmd);
        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }
    private static void runParamTest(String cmd, String args) throws CommandNotFoundException, UnrecognisedParameterException {
        Object obj = client.run(cmd, args);
        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }
}
