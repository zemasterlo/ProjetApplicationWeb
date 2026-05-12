package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Game;
import fr.enseeiht.tusmo.entity.Score;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.GameRepository;
import fr.enseeiht.tusmo.repository.ScoreRepository;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameRepository gameRepository;


    @Transactional
    public Score recordScore(Long userId, Long gameId, int tempsTotalSecondes, int nombreEssais) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable"));
        
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));

        int pointsGagnes = Math.max(0, 1000 - (nombreEssais * 50) - (tempsTotalSecondes * 2));

        Optional<Score> existingScore = scoreRepository.findByUserIdAndGameId(userId, gameId);
        Score score;
        
        if (existingScore.isPresent()) {
            score = existingScore.get();
            score.setPoints(score.getPoints() + pointsGagnes);
            score.setTempsTotal(score.getTempsTotal() + tempsTotalSecondes);
            score.setNombreEssais(score.getNombreEssais() + nombreEssais);
        } else {
            score = Score.builder()
                    .user(user)
                    .game(game)
                    .points(pointsGagnes)
                    .tempsTotal(tempsTotalSecondes)
                    .nombreEssais(nombreEssais)
                    .build();
        }

        return scoreRepository.save(score);
    }

    public Optional<Score> getPlayerScore(Long userId, Long gameId) {
        return scoreRepository.findByUserIdAndGameId(userId, gameId);
    }

    public List<Score> getGameLeaderboard(Long gameId) {
        return scoreRepository.findByGameIdOrderByPointsDesc(gameId);
    }
}
