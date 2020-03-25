package client.entities.adapters;

import client.NodeRPCHelper;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import static client.boundary.ClientWebSocket.ObjEncoder.encode;

public class TransRecordTypeAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        NodeRPCHelper.TransRecord tx = (NodeRPCHelper.TransRecord) value;

        DateTimeFormatter formatter =
        DateTimeFormatter.ofPattern( "dd/MM/yy HH:mm:ss")
                        .withLocale( Locale.UK )
                        .withZone( ZoneId.systemDefault() );

        out.beginObject();
        out.name("timeStamp").value(formatter.format(tx.getTimeStamp()).toString());
        out.name("txHash").value(tx.getTxHash().toString());
        out.name("states").value(encode(tx.getStates()));

        out.endObject();
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
