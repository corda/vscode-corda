export function chosenNode(client, connection) {
        
    client.send(JSON.stringify({"cmd":"connect","content":JSON.stringify(
        connection
    )}));
        
}

export function  loadNodeInfo(client){
    client.send(JSON.stringify({"cmd":"getNodeInfo"}));
}

export function loadFlowInfo(client){
    client.send(JSON.stringify({"cmd": "getRegisteredFlows"}))
    client.send(JSON.stringify({"cmd": "getRegisteredFlowParams"}))
} 

export function loadTransactionHistory(client){
    client.send(JSON.stringify({"cmd": "getTransactionMap"}))
}

export function loadStateNames(client){
    client.send(JSON.stringify({"cmd" : "getStateNames" }))
}

export function startFlow(client, flowName, paramValues){
    var args;
    
    if(!paramValues){
        args = []
    }else{
        var orderedParams = {}
        var re = /\d+/g
        Object.keys(paramValues).sort(function(a,b){
            return(a.match(re) > b.match(re))
        }).forEach(function(key) {
            orderedParams[key] = paramValues[key];
        });
        args = Object.keys(orderedParams).map(function(key) {
            return orderedParams[key];
        });
    }
    var content = {
      "flow" : flowName,
      "args" : args
    }
    client.send(JSON.stringify({"cmd": "startFlow", "content":JSON.stringify(           
      content
     )}));
  }

  export function startUserVaultQuery(client, queryValues){
    var content = {
      "args" : { // args will be used in future default values currently set below
          // pageSpecification: ?
          // pageSize: ?
          sortAttribute: "NOTARY_NAME",
          sortDirection: "ASC"
      },
      "values" : queryValues
    }
    client.send(JSON.stringify({"cmd": "userVaultQuery", "content": JSON.stringify(          
      content
    )}));
}