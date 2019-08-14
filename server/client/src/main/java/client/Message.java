package client;

public class Message {
    private String from;
    private String to;
    private String content;

    public Message() {}
    public Message(String from, String content) {
        this.from = from;
        this.content = content;
    }

    @Override
    public String toString() {
        return super.toString();
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}