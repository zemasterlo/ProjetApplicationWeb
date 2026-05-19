package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Score;
import fr.enseeiht.tusmo.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @PostMapping
    public ResponseEntity<Score> recordScore(
            @RequestParam Long userId,
            @RequestParam Long gameId,
            @RequestParam int tempsTotalSecondes,
            @RequestParam int nombreEssais,
            @RequestParam boolean aGagne) {
        try {
            Score score = scoreService.recordScore(userId, gameId, tempsTotalSecondes, nombreEssais, aGagne);
            return ResponseEntity.ok(score);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/game/{gameId}/leaderboard")
    public ResponseEntity<List<Score>> getLeaderboard(@PathVariable Long gameId) {
        return ResponseEntity.ok(scoreService.getGameLeaderboard(gameId));
    }

    @GetMapping("/user/{userId}/game/{gameId}")
    public ResponseEntity<Score> getPlayerScore(@PathVariable Long userId, @PathVariable Long gameId) {
        return scoreService.getPlayerScore(userId, gameId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
