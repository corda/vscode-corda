package client.entities;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.corda.core.node.NodeInfo;

import javax.websocket.EncodeException;
import javax.websocket.Encoder;
import javax.websocket.EndpointConfig;
import java.util.HashMap;
import java.util.Map;

public class NodeInfoEncoder implements Encoder.Text<NodeInfo> {

    // below GsonBuilder will
    private static Gson gson = new GsonBuilder().disableHtmlEscaping().create();

    @Override
    public String encode(NodeInfo nodeInfo) throws EncodeException {
        Map<String, String> map = new HashMap<String, String>();
        map.put("addresses", nodeInfo.getAddresses().toString());
        map.put("legalIdentities", nodeInfo.getLegalIdentities().toString());
        map.put("platformVersion", Integer.toString(nodeInfo.getPlatformVersion()));
        map.put("serial", Long.toString(nodeInfo.getSerial()));

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String json = objectMapper.writeValueAsString(map);
            return json;
        } catch (JsonProcessingException e) {
            throw new EncodeException(e, "failed NodeInfo json encoding");
        }
    }

    @Override
    public void init(EndpointConfig endpointConfig) {
        // Custom initialization logic
    }

    @Override
    public void destroy() {
        // Close resources
    }
}