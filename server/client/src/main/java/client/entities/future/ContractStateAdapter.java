package client.entities.future;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;
import net.corda.core.contracts.ContractState;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.List;

import static client.boundary.ClientWebSocket.ObjEncoder.encode;

public class ContractStateAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        ContractState cs = (ContractState) value;

        Field[] fields = cs.getClass().getDeclaredFields();

        out.beginObject();
        for (Field f : fields) {
            try {
                out.name(f.getName()).value(encode(f.get(cs)));
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            }
        }
        out.endObject();
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
