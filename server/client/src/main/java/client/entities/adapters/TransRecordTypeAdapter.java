package client.entities.adapters;

import client.NodeRPCClient;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;

import static client.boundary.ClientWebSocket.ObjEncoder.encode;

public class TransRecordTypeAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        NodeRPCClient.TransRecord tx = (NodeRPCClient.TransRecord) value;

        out.beginObject();
        out.name("timeStamp").value(tx.getTimeStamp().toString());
        out.name("txHash").value(tx.getTxHash().toString());
        out.name("states").value(encode(tx.getStates()));
        out.endObject();
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
