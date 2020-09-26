/**
 * Constants for Inherited Corda Core Types
 */
export abstract class Constants {
    static readonly contractStateBaseInterfaces = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
    static readonly contractBaseInterface = ['Contract'];
	static readonly flowBaseClass = ['FlowLogic'];
	static readonly gitHubApi = {
        'cordapp-template-java':'https://api.github.com/repos/corda/cordapp-template-java/zipball',
        'bootcamp-cordapp':'https://api.github.com/repos/corda/bootcamp-cordapp/zipball'
    };
}

export const GRADLE_TASKS_EXTENSION_ID = 'richardwillis.vscode-gradle';
export const SERVER_BASE_URL = 'http://localhost:8580';
export const SERVER_JAR = "explorer-server-0.1.0.jar";

export abstract class WorkStateKeys {
    static readonly PROJECT_IS_CORDA = 'projectIsCorda';
    static readonly DEPLOY_NODES_LIST = 'deployNodesList';
    static readonly DEPLOY_NODES_BUILD_GRADLE = 'deployNodesBuildGradle';
    static readonly ARE_NODES_DEPLOYED = 'areNodesDeployed';
    static readonly IS_NETWORK_RUNNING = 'isNetworkRunning';
}

export abstract class GlobalStateKeys {
    static readonly CLIENT_TOKEN = 'clientToken';
    static readonly RUNNING_NODES = 'runningNodes';
}