package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Guess;
import fr.enseeiht.tusmo.service.GuessService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guesses")
public class GuessController {

    @Autowired
    private GuessService guessService;

    @PostMapping
    public ResponseEntity<?> faireTentative(
            @RequestParam Long roundId,
            @RequestParam Long userId,
            @RequestParam String motPropose) {
        try {
            Guess guess = guessService.faireTentative(roundId, userId, motPropose);
            return ResponseEntity.ok(guess);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/round/{roundId}")
    public ResponseEntity<List<Guess>> getGuessesByRound(@PathVariable Long roundId) {
        return ResponseEntity.ok(guessService.getGuessesByRound(roundId));
    }

    @GetMapping("/round/{roundId}/user/{userId}")
    public ResponseEntity<List<Guess>> getGuessesByRoundAndUser(
            @PathVariable Long roundId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(guessService.getGuessesByRoundAndUser(roundId, userId));
    }
}
