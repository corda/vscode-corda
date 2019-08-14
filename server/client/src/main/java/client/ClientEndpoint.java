package client;


import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

// WEBSOCKET server for client
@ServerEndpoint(value = "/chat/{node}", decoders = MessageDecoder.class, encoders = MessageEncoder.class)
public class ClientEndpoint {
    private Session session;
    private static final Set<ClientEndpoint> clientEndPoints = new CopyOnWriteArraySet<>();
    private static HashMap<String, String> nodes = new HashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("node") String node) throws IOException, EncodeException {

        this.session = session;
        clientEndPoints.add(this);
        nodes.put(session.getId(), node);

        Message message = new Message(node, session.getId() + "connected!");
        this.session.getBasicRemote().sendObject(message); // send out
    }

    @OnMessage
    public void onMessage(Session session, Message message) throws IOException, EncodeException {
        message.setFrom(nodes.get(session.getId()));
        System.out.println(message); // test print of received
    }

    @OnClose
    public void onClose(Session session) throws IOException, EncodeException {
        clientEndPoints.remove(this);
        Message message = new Message(nodes.get(session.getId()), session.getId() + "disconnect!");
        System.out.println(message); // test print close
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        // error handling
    }


}
