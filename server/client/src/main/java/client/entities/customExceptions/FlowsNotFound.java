package client.entities.customExceptions;

public class FlowsNotFound extends Exception{
    private String msg;
    public FlowsNotFound(String msg){
        this.msg = msg;
    }
    public String toString(){
        return msg;
    }
}
