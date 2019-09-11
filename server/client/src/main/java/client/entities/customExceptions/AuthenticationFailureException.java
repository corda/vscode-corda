package client.entities.customExceptions;

public class AuthenticationFailureException extends Exception{
    private String msg;
    public AuthenticationFailureException(String msg){
        this.msg = msg;
    }
    public String toString(){
        return msg;
    }
}