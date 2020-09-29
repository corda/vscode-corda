/**
 * Constants for Inherited Corda Core Types
 */
export abstract class Constants {
    static readonly CONTRACTSTATE_BASE_INTERFACES = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
    static readonly CONTRACT_BASE_INTERFACE = ['Contract'];
	static readonly FLOW_BASE_CLASS = ['FlowLogic'];
	static readonly GITHUB_API = {
        'cordapp-template-java':'https://api.github.com/repos/corda/cordapp-template-java/zipball',
        'bootcamp-cordapp':'https://api.github.com/repos/corda/bootcamp-cordapp/zipball'
    };
}

export const GRADLE_TASKS_EXTENSION_ID = 'richardwillis.vscode-gradle';
export const SERVER_BASE_URL = 'http://localhost:8580';
export const SERVER_JAR = 'explorer-server-0.1.0.jar';
export const RUN_CORDA_CMD = 'java -jar corda.jar';

export abstract class WorkStateKeys {
    static readonly PROJECT_IS_CORDA = 'projectIsCorda';
    static readonly DEPLOY_NODES_LIST = 'deployNodesList';
    static readonly DEPLOY_NODES_BUILD_GRADLE = 'deployNodesBuildGradle';
    static readonly ARE_NODES_DEPLOYED = 'areNodesDeployed';
    static readonly IS_NETWORK_RUNNING = 'isNetworkRunning';

    static readonly ALL_KEYS = [
        WorkStateKeys.PROJECT_IS_CORDA,
        WorkStateKeys.DEPLOY_NODES_LIST, 
        WorkStateKeys.DEPLOY_NODES_BUILD_GRADLE,
        WorkStateKeys.ARE_NODES_DEPLOYED,
        WorkStateKeys.IS_NETWORK_RUNNING
    ]
}

export abstract class Views {
    static readonly CORDA_PROJECTS_VIEW = "cordaProjects";
    static readonly CORDA_OPERATIONS_VIEW = "cordaOperations";
    static readonly CORDA_LOCALNETWORK_VIEW = "cordaLocalNetwork";
    static readonly CORDA_DEPENDENCIES_VIEW = "cordaDependencies";
    static readonly CORDA_FLOWS_VIEW = "cordaFlows";
    static readonly CORDA_CONTRACTS_VIEW = "cordaContracts";
    static readonly CORDA_STATES_VIEW = "cordaStates";
}

export abstract class GlobalStateKeys {
    static readonly CLIENT_TOKEN = 'clientToken';
    static readonly RUNNING_NODES = 'runningNodes';
}

export abstract class Contexts {
    static readonly PROJECT_IS_CORDA_CONTEXT = "vscode-corda:projectIsCorda";
    static readonly ARE_NODES_DEPLOYED_CONTEXT = "vscode-corda:areNodesDeployed";
    static readonly IS_NETWORK_RUNNING_CONTEXT = "vscode-corda:isNetworkRunning";
}

export abstract class Commands {
    static readonly PROJECT_NEW = "cordaProjects.net";
    static readonly FLOWS_ADD = "cordaFlows.add";
    static readonly CONTRACTS_ADD = "cordaContracts.add";
    static readonly STATES_ADD = "cordaStates.add";
    static readonly FLOWS_REFRESH = "cordaFlows.refresh";
    static readonly CONTRACTS_REFRESH = "cordaContracts.refresh";
    static readonly STATES_REFRESH = "cordaStates.refresh";
    static readonly NETWORK_REFRESH = "corda.localNetwork.refresh";
    static readonly NETWORK_MAP_SHOW = "corda.localNetwork.networkMap";
    static readonly NETWORK_EDIT = "corda.localNetwork.edit";
    static readonly NETWORK_DEPLOYNODES = "corda.localNetwork.deployNodes";
    static readonly NETWORK_RUN_DISABLED = "corda.localNetwork.runNodesDisabled";
    static readonly NETWORK_RUN = "corda.localNetwork.runNodes";
    static readonly NETWORK_STOP = "corda.localNetwork.runNodesStop";
    static readonly NODE_RUN_FLOW = "corda.Node.runFlow";
    static readonly NODE_VAULT_QUERY = "corda.Node.vaultQuery";
    static readonly NODE_LOGVIEWER = "corda.Node.logViewer";

    // DEFINED IN TREE-PROVIDER
    static readonly OPERATIONS_ASSEMBLE = 'corda.operations.assembleCommand';
    static readonly OPERATIONS_BUILD = 'corda.operations.buildCommand';
    static readonly OPERATIONS_TEST = 'corda.operations.testCommand';
    static readonly OPERATIONS_CLEAN = 'corda.operations.cleanCommand';
    static readonly OPERATIONS_RUN = 'corda.operations.run';
    static readonly OPERATIONS_REFRESH = 'corda.operations.refresh';
    static readonly OPERATIONS_STOP = 'corda.operations.stop';

    static readonly CORDA_OPEN_FILE = 'corda.openFile';
}