package client.entities.adapters;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import net.corda.core.node.services.Vault;

import java.io.IOException;

public class StateMetadataTypeAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        Vault.StateMetadata stateMeta = (Vault.StateMetadata) value;
        out.beginObject();
        out.name("stateType").value(stateMeta.getContractStateClassName());
        out.name("stateRef").value(stateMeta.getRef().toString());
        out.name("recordedTime").value(stateMeta.getRecordedTime().toString());
        out.endObject();
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
