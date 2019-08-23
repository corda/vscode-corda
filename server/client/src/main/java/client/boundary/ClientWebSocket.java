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

/**
 * This class handles websocket connections form the Corda VSCODE extension.
 * Commands are passed via Message Object which consists of: cmd, content
 * cmd - the request to forward to the NodeRPCClient
 * content - args etc.
 */
@CrossOrigin(origins = "*")
@ServerEndpoint(value = "/session", decoders = MessageDecoder.class,
        encoders = { MessageEncoder.class })
public class ClientWebSocket {

    private Session session;
    private static List<String> nodes = new ArrayList<>();
    private NodeRPCClient client;

    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        this.session = session;
        System.out.println(this.session.getId() + " connected!");
        Message response = new Message("socket open", "connected!");
        sendResponse(response);
    }

    @OnMessage
    public void onMessage(Session session, Message message) throws Exception {
        // debug
        System.out.println(session.getId() + " sent cmd: " + message.getCmd() + ", sent content: " + message.getContent());

        String msgCmd = message.getCmd();
        HashMap<String, String> content = null;

        // parse message content if it exists
        if(message.getContent().length() > 0) {
            content = new ObjectMapper().readValue(message.getContent(), HashMap.class);
        }

        // initial connection will have node details in the content to set client connection
        if (msgCmd.equals("connect")) {

            HashMap<String, String> node = new ObjectMapper().readValue(message.getContent(), HashMap.class);
            client = new NodeRPCClient(node.get("host"), node.get("username"), node.get("password"));

        } else if (message.getCmd().equals("startFlow")) {

            // message.content contains the flow and args
            client.run(message.getCmd(), message.getContent(), new String[] {""});

        } else {
            sendResponse(message, client.run(message.getCmd()));
        }


    }

    // TODO: Add notifyServerAndClose send to client and have RPCClient close the connection
    @OnClose
    public void onClose(Session session) throws IOException, EncodeException {
        System.out.println(session.getId() + " disconnected onClose");
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        // error handling
    }

    // overloaded sendResponse sends messages back to the client web-view
    private void sendResponse(Message message) throws IOException, EncodeException {
        session.getBasicRemote().sendObject(message);
    }
    private void sendResponse(Message message, Object obj) throws IOException, EncodeException {
        // Cast for custom encoding
        String content = "";
        if (obj instanceof Collection) content = ObjEncoder.encode((Collection) obj);
        else if (obj instanceof String) content = ObjEncoder.encode((String) obj);
        else if (obj instanceof NodeInfo) content = ObjEncoder.encode((NodeInfo) obj);
        else content = obj.toString();
        message.setContent(content);

        session.getBasicRemote().sendObject(message);
    }

}
