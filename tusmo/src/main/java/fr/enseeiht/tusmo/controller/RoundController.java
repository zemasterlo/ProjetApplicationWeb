package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Round;
import fr.enseeiht.tusmo.service.GameService;
import fr.enseeiht.tusmo.service.RoundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rounds")
public class RoundController {

    @Autowired
    private RoundService roundService;

    @Autowired
    private GameService gameService;

    @PostMapping("/start-next")
    public ResponseEntity<Round> startNextRound(@RequestParam Long gameId, @RequestParam int numeroRound) {
        try {
            Round newRound = gameService.startNewRound(gameId, numeroRound);
            return ResponseEntity.ok(newRound);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{roundId}/end")
    public ResponseEntity<Round> endRound(@PathVariable Long roundId) {
        try {
            return ResponseEntity.ok(roundService.endRound(roundId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
