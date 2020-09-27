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

export abstract class GlobalStateKeys {
    static readonly CLIENT_TOKEN = 'clientToken';
    static readonly RUNNING_NODES = 'runningNodes';
}