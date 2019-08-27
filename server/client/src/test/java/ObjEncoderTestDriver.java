import client.NodeRPCClient;
import client.boundary.ClientWebSocket;

/**
 *         cmd.put("getStateNames", node::getStateNames);
 *         cmd.put("getStatesInVault", node::getStatesInVault);
 *         cmd.put("getRegisteredFlowParams", node::getRegisteredFlowParams);
 *         cmd.put("closeConnection", node::closeConnection); // RETURNS NULL
 *         cmd.put("getUptime", node::getUptime);
 */

public class ObjEncoderTestDriver {

    public static void main(String[] args) throws Exception {

        NodeRPCClient client = new NodeRPCClient("localhost:10009", "user1", "test");
        System.out.println("\n\n");

//        testNodeInfo(client);
//        testFlowParams(client);
        //testStateNames(client);
//        testStatesInVault(client);
        testGetUptime(client);
    }

    private static void testNodeInfo(NodeRPCClient client) throws Exception {
        Object obj = client.run("getNodeInfo");

        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }

    private static void testFlowParams(NodeRPCClient client) throws Exception {
        Object obj = client.run("getRegisteredFlowParams");

        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }

    private static void testStateNames(NodeRPCClient client) throws Exception {
        Object obj = client.run("getStateNames");

        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }

    private static void testStatesInVault(NodeRPCClient client) throws Exception {
        Object obj = client.run("getStatesInVault");

        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }

    private static void testGetUptime(NodeRPCClient client) throws Exception {
        Object obj = client.run("getUptime");

        System.out.println(ClientWebSocket.ObjEncoder.encode(obj));
    }

}
