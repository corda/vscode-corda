import client.NodeRPCClient;
import com.google.gson.Gson;
import net.corda.core.contracts.ContractState;

import java.util.Set;


// THIS CLASS IS ONLY FOR QUICKLY TESTING CLIENT
public class Tester {

    public static void main(String[] args) {
//        Gson gson = new Gson();
//        NodeRPCClient client = new NodeRPCClient("localhost:10009","user1","test");
//
//        Set<ContractState> contracts = client.getStateClasses();
//        ContractState contractState = contracts.iterator().next();
//
//        Class<?> objClass = contractState.getClass();
//        System.out.println(objClass.getConstructors().toString());
//        System.out.println(objClass.getDeclaredFields().toString());
        String s = "{\"cmd\":\"getNodeInfo\",\"content\":\"{\\\"legalIdentities\\\":\\\"[O=PartyB, L=New York, C=US]\\\",\\\"addresses\\\":\\\"[localhost:10008]\\\",\\\"serial\\\":\\\"1566204244459\\\",\\\"platformVersion\\\":\\\"4\\\"}\"}";
        System.out.println(s);
        s = s.replace("\\","");
        System.out.println(s);
    }
}
