package client.boundary;

import client.NodeRPCClient;
import client.entities.Message;
import client.entities.MessageDecoder;
import client.entities.MessageEncoder;
import client.entities.adapters.*;
import client.entities.customExceptions.CommandNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.corda.core.concurrent.CordaFuture;
import net.corda.core.contracts.ContractState;
import net.corda.core.identity.Party;
import net.corda.core.messaging.DataFeed;
import net.corda.core.messaging.FlowHandle;
import net.corda.core.node.NodeInfo;
import net.corda.core.node.services.Vault;
import org.springframework.web.bind.annotation.CrossOrigin;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

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
    private NodeRPCClient client;

    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        this.session = session;
        System.out.println(this.session.getId() + " connected!");
        Message response = new Message();
        response.setResult("OK");
        sendResponse(response);
    }

    @SuppressWarnings("unchecked")
    @OnMessage
    public void onMessage(Session session, Message message) {
        // debug
        System.out.println(session.getId() + " sent cmd: " + message.getCmd() + ", sent content: " + message.getContent());
        String msgCmd = message.getCmd();
        Object retObj = null; // store a returned content object
        HashMap<String, String> content = null;

        try {
            // parse message content if it exists
            if (message.getContent().length() > 0) {
                content = new ObjectMapper().readValue(message.getContent(), HashMap.class);

            }
            switch(msgCmd){
                case "connect":
                    HashMap<String, String> node = new ObjectMapper().readValue(message.getContent(), HashMap.class);
                    client = new NodeRPCClient(node.get("host"), node.get("username"), node.get("password"), node.get("cordappDir"));
                    // on connect start new thread for vault-tracking
                    new Thread(() -> {
                        try {
                            startVaultTracking();
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }).start();
                    break;
                case "startFlow":
                    FlowHandle flowHandle = (FlowHandle) client.run(msgCmd, content);
                    message.setResult("{\"status\" : \"OK\", \"result\":\"Flow Started\", \"id\": \"" + flowHandle.getId() + "\"}");

                    CordaFuture detail = flowHandle.getReturnValue();
                    detail.then(corda ->{
                        CompletableFuture completed = detail.toCompletableFuture();
                        if(completed.isCompletedExceptionally()){
                            message.setResult("{\"status\" : \"ERR\", \"result\":\"Flow Finished Exceptionally\", \"id\": \"" + flowHandle.getId() + "\"}");
                        }else{
                            message.setResult("{\"status\" : \"OK\", \"result\":\"Flow Finished\", \"id\": \"" + flowHandle.getId() + "\"}");

                        }
                        try {
                            sendResponse(message);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        return corda;
                    });

                    break;
                case "userVaultQuery":
                case "getStateProperties":
                    // custom message result can be added
                    retObj = client.run(msgCmd, content);
                    break;
                default:
                    retObj = client.run(msgCmd);

            }

        } catch (Exception e) {
            e.printStackTrace();
            message.setCmd("ERR");
            message.setResult("{\"status\" : \"ERR\", \"result\": \""  + e.toString() + "\"}");
        }
        try{
            if (retObj != null) sendResponse(message, retObj);
            else sendResponse(message);
        } catch (EncodeException | IOException e) {
            e.printStackTrace();
        }


    }

    @OnClose
    public void onClose(Session session) {
        if(client != null) client.closeConnection();
        System.out.println(session.getId() + " disconnected onClose");
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        // error handling
    }

    // starts the vaultTracking on ALL states
    // response sent for each state updated
    @SuppressWarnings("unchecked")
    private void startVaultTracking() throws Exception {
        DataFeed<Vault.Page<ContractState>, Vault.Update<ContractState>> feed =
                (DataFeed<Vault.Page<ContractState>, Vault.Update<ContractState>>) client.run("startVaultTrack");

        feed.getUpdates().toBlocking().subscribe(update -> {
            client.updateNodeData();
            Message stateUpdate = new Message();
            stateUpdate.setCmd("vaultTrackResponse");
            try {
                sendResponse(stateUpdate, client.run("getTransactionMap"));
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

    }

    // overloaded sendResponse sends messages back to the client web-view
    private void sendResponse(Message message) throws IOException, EncodeException {
        session.getBasicRemote().sendObject(message);
    }
    private void sendResponse(Message message, Object obj) throws IOException, EncodeException {
        String content = ObjEncoder.encode(obj);
        message.setContent(content);
        session.getBasicRemote().sendObject(message);
    }

    public static class ObjEncoder {

        // set type adapter, and other options on Gson
        private static GsonBuilder gsonBuilder = new GsonBuilder().disableHtmlEscaping().setPrettyPrinting();

        public static String encode(Object obj) {
            Gson gson = gsonBuilder.registerTypeAdapter(Party.class, new PartyTypeAdapter())
                    .registerTypeAdapter(NodeInfo.class, new NodeInfoTypeAdapter())
                    .registerTypeAdapter(Class.class, new ClassTypeAdapter())
                    .registerTypeAdapter(Vault.StateMetadata.class, new StateMetadataTypeAdapter())
                    .registerTypeAdapter(NodeRPCClient.TransRecord.class, new TransRecordTypeAdapter())
                    .create();
            return gson.toJson(obj);
        }

    }

}
