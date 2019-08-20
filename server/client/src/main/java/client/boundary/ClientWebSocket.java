package client.boundary;

import client.NodeRPCClient;
import client.entities.Message;
import client.entities.MessageDecoder;
import client.entities.MessageEncoder;
import client.entities.ObjEncoder;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.corda.core.node.NodeInfo;
import org.springframework.web.bind.annotation.CrossOrigin;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.*;

@CrossOrigin(origins = "*")
@ServerEndpoint(value = "/session", decoders = MessageDecoder.class,
        encoders = { MessageEncoder.class })
public class ClientWebSocket {

    private Session session;
    private static List<String> nodes = new ArrayList<>();
    private NodeRPCClient client;

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
    public void onMessage(Session session, Message message) throws Exception {
        // debug
        System.out.println(session.getId() + " sent cmd: " + message.getCmd() + ", sent content: " + message.getContent());

        // initial connection will have node details in the content to set client connection
        if (message.getContent() != null) {
            HashMap<String, String> node = new ObjectMapper().readValue(message.getContent(), HashMap.class);

            client = new NodeRPCClient(node.get("host"), node.get("username"), node.get("password"));
        }

        sendResponse(message, client.run(message.getCmd()));
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

    private void sendResponse(Message message, Object obj) throws IOException, EncodeException {
        // Cast for custom encoding
        String content = "";
        if (obj instanceof Collection) content = ObjEncoder.encode((Collection) obj);
        else if (obj instanceof String) content = ObjEncoder.encode((String) obj);
        else if (obj instanceof NodeInfo) content = ObjEncoder.encode((NodeInfo) obj);
        message.setContent(content);

        session.getBasicRemote().sendObject(message);
    }

}
