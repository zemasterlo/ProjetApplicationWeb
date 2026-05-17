package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.dto.RoundHintDTO;
import fr.enseeiht.tusmo.entity.*;
import fr.enseeiht.tusmo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GameService {

    private static final int DEFAULT_NOMBRE_ROUNDS = 3;
    private static final int MAX_TENTATIVES = 6;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private WordRepository wordRepository;

    @Autowired
    private GuessRepository guessRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ScoreRepository scoreRepository;

    @Transactional
    public Game startGame(Long roomId, int nombreRounds) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));

        Optional<Game> existingGame = gameRepository.findByRoomIdAndStatut(roomId, GameStatus.IN_PROGRESS);
        if (existingGame.isPresent()) {
            throw new IllegalStateException("Une partie est déjà en cours dans cette salle.");
        }

        if (nombreRounds <= 0) {
            nombreRounds = DEFAULT_NOMBRE_ROUNDS;
        }

        Game game = Game.builder()
                .room(room)
                .dateDebut(LocalDateTime.now())
                .statut(GameStatus.IN_PROGRESS)
                .nombreRoundsTotal(nombreRounds)
                .roundActuel(1)
                .build();
        game = gameRepository.save(game);

        room.setStatut(RoomStatus.IN_PROGRESS);
        roomRepository.save(room);

        Round firstRound = startNewRound(game.getId(), 1);

        // Notifier tous les joueurs via WebSocket
        String mot = firstRound.getWord().getMot().toUpperCase();
        RoundHintDTO hint = new RoundHintDTO(firstRound.getId(), 1, mot.charAt(0), mot.length());
        notificationService.notifyGameStarted(room.getCode(), game.getId(), hint);

        return game;
    }

    @Transactional
    public Round startNewRound(Long gameId, int numeroRound) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));

        Word randomWord = wordRepository.findRandomWord()
                .orElseThrow(() -> new RuntimeException("Dictionnaire vide ! Ajoutez des mots en BDD."));

        game.setRoundActuel(numeroRound);
        gameRepository.save(game);

        Round round = Round.builder()
                .game(game)
                .word(randomWord)
                .numeroRound(numeroRound)
                .dateDebut(LocalDateTime.now())
                .build();

        return roundRepository.save(round);
    }

    /**
     * Vérifie si tous les joueurs ont fini le round courant.
     * Si oui, termine le round et passe au suivant (ou termine la partie).
     * Retourne true si une transition a eu lieu.
     */
    @Transactional
    public boolean checkAndAdvanceRound(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round introuvable"));

        Game game = round.getGame();
        Room room = game.getRoom();
        List<User> players = room.getPlayers();

        // Vérifier si chaque joueur a terminé (trouvé le mot OU épuisé ses essais)
        for (User player : players) {
            List<Guess> playerGuesses = guessRepository.findByRoundIdAndUserId(roundId, player.getId());

            boolean aGagne = playerGuesses.stream().anyMatch(Guess::isEstCorrect);
            boolean aEpuiseSesEssais = playerGuesses.size() >= MAX_TENTATIVES;

            if (!aGagne && !aEpuiseSesEssais) {
                // Ce joueur n'a pas encore fini → on ne fait rien
                return false;
            }
        }

        // Tous les joueurs ont fini ce round
        round.setDateFin(LocalDateTime.now());
        roundRepository.save(round);

        String motCorrect = round.getWord().getMot().toUpperCase();
        notificationService.notifyRoundEnded(room.getCode(), round.getNumeroRound(), motCorrect);

        int prochainRound = round.getNumeroRound() + 1;

        if (prochainRound > game.getNombreRoundsTotal()) {
            // C'était le dernier round → fin de la partie
            endGame(game.getId());
        } else {
            // Passer au round suivant
            Round newRound = startNewRound(game.getId(), prochainRound);
            String newMot = newRound.getWord().getMot().toUpperCase();
            RoundHintDTO hint = new RoundHintDTO(newRound.getId(), prochainRound, newMot.charAt(0), newMot.length());
            notificationService.notifyNewRound(room.getCode(), hint);
        }

        return true;
    }

    @Transactional
    public void endGame(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));
        
        game.setStatut(GameStatus.FINISHED);
        game.setDateFin(LocalDateTime.now());
        gameRepository.save(game);

        Room room = game.getRoom();
        room.setStatut(RoomStatus.WAITING);
        roomRepository.save(room);

        // Construire le classement et notifier
        List<Score> scores = scoreRepository.findByGameIdOrderByPointsDesc(gameId);
        List<Map<String, Object>> classement = new ArrayList<>();
        for (int i = 0; i < scores.size(); i++) {
            Score s = scores.get(i);
            classement.add(Map.of(
                    "rang", i + 1,
                    "username", s.getUser().getUsername(),
                    "points", s.getPoints(),
                    "nombreEssais", s.getNombreEssais()
            ));
        }
        notificationService.notifyGameEnded(room.getCode(), classement);
    }

    public List<Game> getGamesHistory(Long roomId) {
        return gameRepository.findByRoomId(roomId);
    }

    /**
     * Récupère l'état complet d'une partie en cours pour permettre la reprise.
     */
    public Map<String, Object> getActiveGameState(Long roomId, Long userId) {
        Optional<Game> activeGame = gameRepository.findByRoomIdAndStatut(roomId, GameStatus.IN_PROGRESS);
        if (activeGame.isEmpty()) {
            return null;
        }

        Game game = activeGame.get();
        int currentRoundNum = game.getRoundActuel();

        Optional<Round> currentRound = roundRepository.findByGameIdAndNumeroRound(game.getId(), currentRoundNum);
        if (currentRound.isEmpty()) {
            return null;
        }

        Round round = currentRound.get();
        String mot = round.getWord().getMot().toUpperCase();

        // Récupérer les tentatives déjà faites par ce joueur
        List<Guess> userGuesses = guessRepository.findByRoundIdAndUserId(round.getId(), userId);
        List<Map<String, Object>> guessesData = new ArrayList<>();
        for (Guess g : userGuesses) {
            guessesData.add(Map.of(
                    "motPropose", g.getMotPropose(),
                    "resultatLettres", g.getResultatLettres(),
                    "estCorrect", g.isEstCorrect()
            ));
        }

        return Map.of(
                "gameId", game.getId(),
                "roundId", round.getId(),
                "premiereLettre", String.valueOf(mot.charAt(0)),
                "longueurMot", mot.length(),
                "numeroRound", currentRoundNum,
                "nombreRoundsTotal", game.getNombreRoundsTotal(),
                "guesses", guessesData
        );
    }
}
