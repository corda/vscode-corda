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