import co.paralleluniverse.fibers.Suspendable;
import net.corda.core.flows.FlowException;
import net.corda.core.flows.FlowLogic;

public class BaseFlow extends FlowLogic<T> {
    
    @Override
    @Suspendable
    public T call() throws FlowException {
        return null;
    }
}
