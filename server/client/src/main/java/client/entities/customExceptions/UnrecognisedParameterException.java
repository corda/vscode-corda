package client.entities.customExceptions;

public class UnrecognisedParameterException extends Exception{
    private String msg;
    public UnrecognisedParameterException(String msg){
        this.msg = msg;
    }
    public String toString(){
        return msg;
    }
}
