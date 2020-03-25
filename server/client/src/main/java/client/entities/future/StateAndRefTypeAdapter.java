package client.entities.future;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import net.corda.core.contracts.ContractState;
import net.corda.core.contracts.StateAndRef;

import javax.swing.plaf.nimbus.State;
import java.io.IOException;

public class StateAndRefTypeAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        StateAndRef<ContractState> stateRef = (StateAndRef<ContractState>) value;
        out.beginObject();
        out.name("state").value(stateRef.getState().getData().toString());
        out.endObject();
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
