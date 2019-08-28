package client.entities.adapters;

import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;

// GENERIC adapter for toString on unhandled classes
public class ClassTypeAdapter extends TypeAdapter {
    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        out.value(value.toString());
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        return null;
    }
}
