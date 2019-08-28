package client.entities.adapters;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import net.corda.core.identity.Party;

import java.io.IOException;

/**
 * {"legalIdentities":"[O=PartyB, L=New York, C=US]",
 * "addresses":"[localhost:10008]",
 * "serial":"1566569470832",
 * "platformVersion":"4"}
 */
public class PartyTypeAdapter extends TypeAdapter {

    @Override
    public void write(JsonWriter out, Object object) throws IOException {
        Party party = (Party) object;
        out.beginObject();
        out.name("Organisation").value(party.getName().getOrganisation());
        out.name("Locality").value(party.getName().getLocality());
        out.name("Country").value(party.getName().getCountry());
        out.endObject();
    }

    @Override
    public Party read(JsonReader in) throws IOException {
        return null; // not needed at this time.
    }
}
