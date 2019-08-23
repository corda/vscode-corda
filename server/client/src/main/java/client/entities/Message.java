package client.entities;

import javax.persistence.Entity;

@Entity
public class Message {
    private String cmd;
    private String content;

    public Message() {
        this.cmd = "";
        this.content = "";
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
}