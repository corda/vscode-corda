package server;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedList;
import java.util.List;

@RestController
public class HelloController {

    private List<String> states = new LinkedList<>();

    // heartbeat endpoint
    @CrossOrigin(origins = "*")
    @GetMapping(value = "/alive", produces = "text/plain")
    private String alive() {
        return "alive!";
    }

    @CrossOrigin(origins = "*")
    @RequestMapping(value = "/updateState", method = RequestMethod.POST)
    public ResponseEntity<List<String>> update(@RequestBody String token) {
        states.add(token);
        return new ResponseEntity<List<String>>(states, HttpStatus.OK);
    }

    @CrossOrigin(origins = "*")
    @GetMapping(value = "/latestState", produces = "text/plain")
    private String latestStates() {

        System.out.println(states.toString());
        return states.toString();
    }

}
