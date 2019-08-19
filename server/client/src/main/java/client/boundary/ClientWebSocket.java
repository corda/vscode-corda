package client.boundary;

import client.NodeRPCClient;
import client.entities.*;
import com.google.gson.Gson;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@ServerEndpoint(value = "/session", decoders = MessageDecoder.class,
        encoders = { MessageEncoder.class, NodeInfoEncoder.class,
                CollectionEncoder.class, StringEncoder.class })
public class ClientWebSocket {

    private Session session;
    private static List<String> nodes = new ArrayList<>();
    //private static final Set<ClientWebSocket> CLIENT_END_POINTS = new CopyOnWriteArraySet<>();

    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        // store session
        this.session = session;
        System.out.println(this.session.getId() + " connected!");
    }

    /*
    TODO:
        1) when node is down, need graceful exit from NodeRPCClient
        2) parties in Classes break valid Json - need to figure out how to handle
            O=Party, L=London, C=GB WITHOUT making a custom encoder for each ContractState
            * in the meantime we can just send as raw string and parse on View side.
     */
    // handle webview requests for node information
    @OnMessage
    public void onMessage(Session session, Message message) throws IOException, EncodeException {
        message.setFrom(session.getId());
        System.out.println(message.getFrom() + " sent cmd: " + message.getContent()); // test print of received

        // Todo: keep track of open client connections so connection
        // single instance for test
        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test");

        switch (message.getContent()) {
            case "getNodeInfo":
                sendResponse(client.getNodeInfo());
                break;
            case "getRegisteredFlows":
                sendResponse(client.getRegisteredFlows());
                break;
            case "getStateNames":
                sendResponse(client.getStateNames());
                break;
            case "getStatesInVault":
                sendResponse(client.getStatesInVault());
                break;
            default:
                sendResponse("No valid command sent: " + message.getContent());
        }

    }

    @OnClose
    public void onClose(Session session) throws IOException, EncodeException {
        Message message = new Message(session.getId(), session.getId() + "disconnect!");
        System.out.println(session.getId() + " CLOSING"); // test print close
        //System.out.println("CLOSING CONNECTION");
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        // error handling
    }

    private void sendResponse(Object obj) throws IOException, EncodeException {
        // Custom encoders are available for NodeInfo, String
        session.getBasicRemote().sendObject(obj);
    }

}
