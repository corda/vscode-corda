package client.entities;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.corda.core.contracts.ContractState;

import javax.websocket.EncodeException;
import javax.websocket.Encoder;
import javax.websocket.EndpointConfig;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class CollectionEncoder implements Encoder.Text<Collection<?>> {

    // disable HtmlEscaping will allows '=' in the string to handle Party Class
    private static Gson gson = new GsonBuilder().disableHtmlEscaping().create();

    @Override
    public String encode(Collection<?> lst) throws EncodeException {
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

    @Override
    public void init(EndpointConfig endpointConfig) {
        // Custom initialization logic
    }

    @Override
    public void destroy() {
        // Close resources
    }
}