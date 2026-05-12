package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.*;
import fr.enseeiht.tusmo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GameService {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private WordRepository wordRepository;

    @Transactional
    public Game startGame(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));

        Optional<Game> existingGame = gameRepository.findByRoomIdAndStatut(roomId, GameStatus.IN_PROGRESS);
        if (existingGame.isPresent()) {
            throw new IllegalStateException("Une partie est déjà en cours dans cette salle.");
        }

        Game game = Game.builder()
                .room(room)
                .dateDebut(LocalDateTime.now())
                .statut(GameStatus.IN_PROGRESS)
                .build();
        game = gameRepository.save(game);

        room.setStatut(RoomStatus.IN_PROGRESS);
        roomRepository.save(room);

        startNewRound(game.getId(), 1);

        return game;
    }

    @Transactional
    public Round startNewRound(Long gameId, int numeroRound) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partie introuvable"));

        Word randomWord = wordRepository.findRandomWord()
                .orElseThrow(() -> new RuntimeException("Dictionnaire vide ! Ajoutez des mots en BDD."));

        Round round = Round.builder()
                .game(game)
                .word(randomWord)
                .numeroRound(numeroRound)
                .dateDebut(LocalDateTime.now())
                .build();

        return roundRepository.save(round);
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
    }

    public List<Game> getGamesHistory(Long roomId) {
        return gameRepository.findByRoomId(roomId);
    }
}
