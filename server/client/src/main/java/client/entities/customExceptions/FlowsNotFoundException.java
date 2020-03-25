package client.entities.customExceptions;

public class FlowsNotFoundException extends Exception{
    private String msg;
    public FlowsNotFoundException(String msg){
        this.msg = msg;
    }
    public String toString(){
        return msg;
    }
}
