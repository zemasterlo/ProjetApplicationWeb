package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Guess;
import fr.enseeiht.tusmo.entity.Round;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.GuessRepository;
import fr.enseeiht.tusmo.repository.RoundRepository;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GuessService {

    @Autowired
    private GuessRepository guessRepository;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private UserRepository userRepository;


    @Transactional
    public Guess faireTentative(Long roundId, Long userId, String motPropose) {

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round introuvable"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable"));

        String motCible = round.getWord().getMot().toUpperCase();
        String tentative = motPropose.toUpperCase();

        if (tentative.length() != motCible.length()) {
            throw new IllegalArgumentException("Le mot proposé n'a pas la bonne longueur (" + motCible.length() + " lettres attendues).");
        }

        boolean estCorrect = tentative.equals(motCible);
        
        Guess guess = Guess.builder()
                .round(round)
                .user(user)
                .motPropose(tentative)
                .dateGuess(LocalDateTime.now())
                .estCorrect(estCorrect)
                .build();

        return guessRepository.save(guess);
    }

    public List<Guess> getGuessesByRound(Long roundId) {
        return guessRepository.findByRoundId(roundId);
    }

    public List<Guess> getGuessesByRoundAndUser(Long roundId, Long userId) {
        return guessRepository.findByRoundIdAndUserId(roundId, userId);
    }
}
