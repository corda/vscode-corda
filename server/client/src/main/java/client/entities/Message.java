package client.entities;

import javax.persistence.Entity;

/**
 * Message class wraps communication over websocket
 */
@Entity
public class Message {
    private String cmd; // command to execute
    private String content; // returned values
    private String result; // status: OK, or error object.

    public Message() {
        this.cmd = "";
        this.content = "";
        this.result = "{\"status\" : \"OK\", \"result\": \"\"}";
    }
    public Message(String cmd, String content) {
        this.cmd = cmd;
        this.content = content;
    }

    @Override
    public String toString() {
        return super.toString();
    }

    public String getCmd() {
        return cmd;
    }

    public void setCmd(String cmd) {
        this.cmd = cmd;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getResult() { return result; }

    public void setResult(String result) { this.result = result; }
}