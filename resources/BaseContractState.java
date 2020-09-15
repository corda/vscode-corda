import net.corda.core.contracts.ContractState;
import net.corda.core.identity.AbstractParty;
import org.jetbrains.annotations.NotNull;

import java.util.List;

public class BaseContractState implements ContractState {

    @NotNull
    @Override
    public List<AbstractParty> getParticipants() {
        return null;
    }
}
