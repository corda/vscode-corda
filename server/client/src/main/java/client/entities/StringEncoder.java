package client.entities;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import javax.websocket.EncodeException;
import javax.websocket.Encoder;
import javax.websocket.EndpointConfig;

public class StringEncoder implements Encoder.Text<String> {

    // disable HtmlEscaping will allows '=' in the string to handle Party Class
    private static Gson gson = new GsonBuilder().disableHtmlEscaping().create();

    @Override
    public String encode(String str) throws EncodeException {
        String json = gson.toJson(str);
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