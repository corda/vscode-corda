package client.boundary;


import client.entities.Message;
import client.entities.MessageDecoder;
import client.entities.MessageEncoder;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

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
     */
    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {

        this.session = session;

        Message message = new Message(session.getId(), session.getId() + " connected!");
        this.session.getBasicRemote().sendObject(message); // send out
        System.out.println(message);
    }

    @OnMessage
    public void onMessage(Session session, Message message) throws IOException, EncodeException {
        message.setFrom(session.getId());
        System.out.println(message.getFrom() + " " + message.getContent()); // test print of received
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
