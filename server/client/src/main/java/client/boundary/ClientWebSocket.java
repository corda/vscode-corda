package client.boundary;


import client.NodeRPCClient;
import client.entities.Message;
import client.entities.MessageDecoder;
import client.entities.MessageEncoder;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

// WEBSOCKET server for client
@ServerEndpoint(value = "/session", decoders = MessageDecoder.class, encoders = MessageEncoder.class)
public class ClientWebSocket {

    private Session session;
    private static List<String> nodes = new ArrayList<>();
    //private static final Set<ClientWebSocket> CLIENT_END_POINTS = new CopyOnWriteArraySet<>();

    /*
    TODO:
     - grab basic information for nodes from webview session
     -- have the webview pass node details from gradle parse
     ---- setup client connections
     - returns from NodeRPCClient need to be converted to JSON
    */


    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        // store session
        this.session = session;

        // send back result
        Message message = new Message(session.getId(), " connected!");
        this.session.getBasicRemote().sendObject(message); // send out

        System.out.println(message);
    }

    /*
    TODO:
        when node is down, need graceful exit from NodeRPCClient
     */
    // handle webview requests for node information
    @OnMessage
    public void onMessage(Session session, Message message) throws IOException, EncodeException {
        message.setFrom(session.getId());
        System.out.println(message.getFrom() + " " + message.getContent()); // test print of received

        // single instance for test
        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test");

        Message response = new Message();
        response.setFrom("server");

        switch (message.getContent()) {
            case "getNodeInfo":
                System.out.println("nodeInfo");
                response.setContent(client.getNodeInfo().toString());
                break;
            case "getRegisteredFlows":
                System.out.println("flows");
                response.setContent(client.getRegisteredFlows().toString());
                break;
            case "getStateNames":
                System.out.println("stateNames");
                response.setContent(client.getStateNames().toString());
                break;
            case "getStateClasses":
                System.out.println("stateClasses");
                response.setContent(client.getStateClasses().toString());
                break;
            default:
                System.out.println("default");
                System.out.println(message.getContent());
                response.setContent("No valid command was sent from webview");
        }

        this.session.getBasicRemote().sendObject(response);
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

}
