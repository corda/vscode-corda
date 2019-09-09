package client.entities.customExceptions;

public class CommandNotFoundException extends Exception{
    private String msg;
    public CommandNotFoundException(String msg){
        this.msg = msg;
    }
    public String toString(){
        return msg;
    }
}