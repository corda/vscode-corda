import com.google.common.collect.ImmutableList;
import net.corda.client.rpc.CordaRPCClient;
import net.corda.core.identity.Party;
import net.corda.core.messaging.CordaRPCOps;

import java.io.File;
import java.io.FileInputStream;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarInputStream;

import static net.corda.core.utilities.NetworkHostAndPort.parse;



// THIS CLASS IS ONLY FOR QUICKLY TESTING CLIENT
public class Tester {

    public static void main(String[] args) throws MalformedURLException, NoSuchMethodException, InvocationTargetException, IllegalAccessException, ClassNotFoundException, InstantiationException {

        CordaRPCClient client = new CordaRPCClient(parse("localhost:10009"));
        CordaRPCOps proxy = client.start("user1", "test").getProxy();

        File file = new File("bootcamp.workflows-java.jar");
        URL url = file.toURI().toURL();
        System.out.println(url);

        URLClassLoader child = new URLClassLoader(
                new URL[] {url},
                ClassLoader.getSystemClassLoader()
        );

        Class classToLoad = Class.forName("bootcamp.flows.TokenIssueFlowInitiator", true, child);
        //Object instance = classToLoad.newInstance();
        System.out.println(classToLoad);


        System.out.println("\n\n");
//        getClassNames("bootcamp.workflows-java.jar");

        List<Constructor> constructors = ImmutableList.copyOf(classToLoad.getConstructors());
        for (Constructor c : constructors) {
            List<Class> paramTypes = ImmutableList.copyOf(c.getParameterTypes());
            for (Class param : paramTypes) {
                System.out.println(param.toString());
            }
        }

        //System.out.println(classToLoad.getConstructors()[0].getParameterTypes()[0]);

        Party a = proxy.partiesFromName("PartyA", true).iterator().next();
        //proxy.startFlowDynamic(classToLoad, lob.toArray());
        // IllegalFlowLogicException
    }

    public static List getClassNames(String jarName) {
        ArrayList classes = new ArrayList();


        System.out.println("Jar " + jarName );
        try {
            JarInputStream jarFile = new JarInputStream(new FileInputStream(
                    jarName));
            JarEntry jarEntry;

            while (true) {
                jarEntry = jarFile.getNextJarEntry();
                if (jarEntry == null) {
                    break;
                }
                if (jarEntry.getName().endsWith(".class")) {

                    System.out.println("Found " + jarEntry.getName().replaceAll("/", "\\."));
                    classes.add(jarEntry.getName().replaceAll("/", "\\."));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return classes;
    }
}
