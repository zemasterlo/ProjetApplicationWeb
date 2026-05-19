package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Game;
import fr.enseeiht.tusmo.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    @Autowired
    private GameService gameService;

    @PostMapping("/start")
    public ResponseEntity<?> startGame(
            @RequestParam Long roomId,
            @RequestParam(required = false, defaultValue = "3") int nombreRounds) {
        try {
            return ResponseEntity.ok(gameService.startGame(roomId, nombreRounds));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Erreur serveur: " + e.getMessage());
        }
    }

    @PostMapping("/{gameId}/end")
    public ResponseEntity<Void> endGame(@PathVariable Long gameId) {
        gameService.endGame(gameId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<java.util.Map<String, Object>>> getGamesHistory(@PathVariable Long roomId) {
        return ResponseEntity.ok(gameService.getGamesHistory(roomId));
    }

    /**
     * Récupère l'état actuel d'une partie en cours pour permettre la reprise.
     * Retourne : gameId, roundId, premiereLettre, longueurMot, numeroRound,
     * nombreRoundsTotal,
     * et les tentatives déjà faites par le joueur.
     */
    @GetMapping("/room/{roomId}/active")
    public ResponseEntity<?> getActiveGameState(
            @PathVariable Long roomId,
            @RequestParam Long userId) {
        try {
            var state = gameService.getActiveGameState(roomId, userId);
            if (state == null) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(state);
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Erreur serveur: " + e.getMessage());
        }
    }
}
