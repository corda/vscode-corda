package client.entities;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.corda.core.contracts.ContractState;
import net.corda.core.node.NodeInfo;

import javax.websocket.EncodeException;
import java.util.*;

public class ObjEncoder {

    private static Gson gson = new GsonBuilder().disableHtmlEscaping().create();


    public static String encode(String str) throws EncodeException {
        String json = gson.toJson(str);
        json.replaceAll("=",":");
        return json;
    }

    public static String encode(NodeInfo nodeInfo) throws EncodeException {
        Map<String, String> map = new HashMap<String, String>();
        map.put("addresses", nodeInfo.getAddresses().toString());
        map.put("legalIdentities", nodeInfo.getLegalIdentities().toString());
        map.put("platformVersion", Integer.toString(nodeInfo.getPlatformVersion()));
        map.put("serial", Long.toString(nodeInfo.getSerial()));

        String json = gson.toJson(map);
        return json;
    }

    public static String encode(Collection<?> lst) throws EncodeException {
        String json = "";

        if (lst != null && !lst.isEmpty()) {

            // Because gson has trouble parsing ContractState parties, if the
            // Collection contains ContractState then take each elements .toString()
            Set<String> contractStrings = new HashSet<>();
            if(lst.iterator().next() instanceof ContractState) {
                lst.iterator().forEachRemaining(x -> {
                    contractStrings.add(x.toString());
                });
                json = gson.toJson(contractStrings);
            } else { // else just serialize as normal
                json = gson.toJson(lst);
            }
        }
        return json;
    }
}
