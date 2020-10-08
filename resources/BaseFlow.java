import co.paralleluniverse.fibers.Suspendable;
import net.corda.core.flows.FlowException;
import net.corda.core.flows.FlowLogic;

public class BaseFlow extends FlowLogic<Void> {
    
    @Override
    @Suspendable
    public Void call() throws FlowException {
        return null;
    }
}
