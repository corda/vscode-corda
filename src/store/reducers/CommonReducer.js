import * as ActionType from '../Actions';

const initialState = {
    isServerAwake: false,
    isLoggedIn: false,
    currentPage: 1,
    loginProcessing: false,
    spinner: false,
    profile: {},
    gradleNodesList: {},
    gradleNodesSet: false,
    firstNode: {}
};

const getNodeData = () => {
    const nodeDefaults = document.getElementById('nodeDefaults').innerHTML;
    const nodeList = document.getElementById('nodeList').innerHTML;

    // deployNodes needs to exist and be found in project build.gradle
    if (nodeDefaults != 'undefined' && nodeList != '[]') {
      const defaultSettings = JSON.parse(nodeDefaults);
      const allNodes = JSON.parse(nodeList);

      var connections = {}

      allNodes.forEach(function(node) {
          if(!node.notary){
              connections[node.name] = {
                  host: node.rpcSettings.address,
                  cordappDir: node.cordappDir   
              }
              if(node.rpcUsers){
                  connections[node.name].username = node.rpcUsers.user;
                  connections[node.name].password = node.rpcUsers.password;
                  
              }else{
                  connections[node.name].username = defaultSettings.rpcUsers.user;
                  connections[node.name].password = defaultSettings.rpcUsers.password;
              }
          }
      });
      return connections;
    }
}

const reducer = (state = initialState, action) => {
    switch ( action.type ) {
        case ActionType.UPDATE_GRADLE_NODES_LIST:
            // console.log("in the reducer " + action.payload[Object.keys(action.payload)[0]]);
            const nodes = getNodeData();
            if (nodes != undefined) {
                const firstNode = nodes[Object.keys(nodes)[0]];
                return {
                    ...state,
                    gradleNodesList: {...nodes},
                    gradleNodesSet: true,
                    firstNode: {...firstNode}
                }
            } else return state;
        case ActionType.SERVER_AWAKE:
            return {
                ...state,
                isServerAwake: true
            }
        case ActionType.LOGIN_SUCCESS:
            // sessionStorage.setItem('isLoggedIn', true);    
            // sessionStorage.setItem('profile', JSON.stringify(action.payload)); 
            const settings = {
                    cordappDirectory: state.firstNode.cordappDir,
                    dateFormat: "",
                    dateTimeFormat: ""
            }
            ActionType.updateSettings(settings, 'cordappDir');   
            return {
                ...state,
                isLoggedIn: true,
                profile: action.payload,
                loginProcessing: false
            }
        case ActionType.CHANGE_SCREEN:
            // sessionStorage.setItem('currentPage', action.page);    
            return {
                ...state,
                currentPage: action.page
            }
        case ActionType.LOAD_APP_STATE: 
            // const isLoggedIn = sessionStorage.getItem("isLoggedIn");
            // const currentPage = Number(sessionStorage.getItem("currentPage"));
            // const profile =  JSON.parse(sessionStorage.getItem('profile'));   
            return{
                ...state
                // isLoggedIn: isLoggedIn,
                // currentPage: currentPage,
                // profile: profile
            }
        case ActionType.LOGOUT: 
            // sessionStorage.removeItem("isLoggedIn");
            // sessionStorage.removeItem("currentPage");
            return{
                ...state,
                isLoggedIn: false,
                currentPage: 0
            }    
        case ActionType.SET_LOGIN_PROCESSING_FLAG:
            return{
                ...state,
                loginProcessing: action.data
            }
        case ActionType.SHOW_HIDE_SPINNER:
            return{
                ...state,
                spinner: action.data
            }     
        default:
            return state;    
    }
}

export default reducer;