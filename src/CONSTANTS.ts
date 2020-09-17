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

export abstract class TestData {
    static readonly mockNetwork = [
        {
            'name':'PartyA',
            'location':'GB',
            'port':'10006'
        },
        {
            'name':'PartyB',
            'location':'CA',
            'port':'10007'
        },
        {
            'name':'PartyA',
            'location':'US',
            'port':'10008'
        }
    ]
}

export const GRADLE_TASKS_EXTENSION_ID = 'richardwillis.vscode-gradle';