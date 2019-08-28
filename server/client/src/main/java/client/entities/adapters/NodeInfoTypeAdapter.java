package client.entities.adapters;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import net.corda.core.identity.Party;
import net.corda.core.node.NodeInfo;

import java.io.IOException;

/**
 * {"legalIdentities":"[O=PartyB, L=New York, C=US]",
 * "addresses":"[localhost:10008]",
 * "serial":"1566569470832",
 * "platformVersion":"4"}
 */
public class NodeInfoTypeAdapter extends TypeAdapter {

    @Override
    public void write(JsonWriter out, Object object) throws IOException {
        NodeInfo node = (NodeInfo) object;
        out.beginObject();
        out.name("legalIdentities").value(node.getLegalIdentities().toString());
        out.name("addresses").value(node.getAddresses().toString());
        out.name("platformVersion").value(node.getPlatformVersion());
        out.name("serial").value(node.getSerial());
        out.endObject();
    }

    @Override
    public Party read(JsonReader in) throws IOException {
        return null; // not needed at this time.
    }
}
