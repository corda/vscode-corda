var ws;

// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
function connect() {
    var sessionName = document.getElementById("session").value;

    //ws = new WebSocket("ws://" +host  + pathname + "chat/" + username);
    ws = new WebSocket("ws://localhost:8080/session");


    ws.onmessage = function(event) {
    var log = document.getElementById("log");
        console.log(event.data);
//        var message = JSON.parse(event.data);
//        log.innerHTML += message.from + " : " + message.content + "\n";
    };
}

function send() {
    var content = document.getElementById("cmd").value;
    var json = JSON.stringify({
        "cmd":content
    });

    ws.send(json);
}

