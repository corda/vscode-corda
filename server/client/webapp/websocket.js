var ws;

function connect() {
    var sessionName = document.getElementById("session").value;

    //ws = new WebSocket("ws://" +host  + pathname + "chat/" + username);
    ws = new WebSocket("ws://localhost:8080/session");


    ws.onmessage = function(event) {
    var log = document.getElementById("log");
        console.log(event.data);
        var message = JSON.parse(event.data);
        log.innerHTML += message.from + " : " + message.content + "\n";
    };
}

function send() {
    var content = document.getElementById("msg").value;
    var json = JSON.stringify({
        "content":content
    });

    ws.send(json);
}

//function close() {
//    ws.close();
//    console.log("closing it");
//}

