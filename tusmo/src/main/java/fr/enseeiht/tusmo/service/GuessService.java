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

    private static final int MAX_TENTATIVES = 6;

    @Autowired
    private GuessRepository guessRepository;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameService gameService;

    @Autowired
    private NotificationService notificationService;


    @Transactional
    public Guess faireTentative(Long roundId, Long userId, String motPropose) {

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round introuvable"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable"));

        // Vérifier les tentatives précédentes du joueur dans ce round
        List<Guess> tentativesPrecedentes = guessRepository.findByRoundIdAndUserId(roundId, userId);

        // Bloquer si le joueur a déjà trouvé le mot
        boolean dejaGagne = tentativesPrecedentes.stream().anyMatch(Guess::isEstCorrect);
        if (dejaGagne) {
            throw new IllegalStateException("Tu as déjà trouvé le mot de ce round !");
        }

        // Bloquer si le joueur a épuisé ses 6 essais
        if (tentativesPrecedentes.size() >= MAX_TENTATIVES) {
            throw new IllegalStateException("Tu as épuisé tes " + MAX_TENTATIVES + " tentatives pour ce round.");
        }

        String motCible = round.getWord().getMot().toUpperCase();
        String tentative = motPropose.toUpperCase();

        if (tentative.length() != motCible.length()) {
            throw new IllegalArgumentException("Le mot proposé n'a pas la bonne longueur (" + motCible.length() + " lettres attendues).");
        }

        boolean estCorrect = tentative.equals(motCible);
        
        String resultatLettres = evaluerTentative(tentative, motCible);

        Guess guess = Guess.builder()
                .round(round)
                .user(user)
                .motPropose(tentative)
                .dateGuess(LocalDateTime.now())
                .estCorrect(estCorrect)
                .resultatLettres(resultatLettres)
                .build();

        Guess savedGuess = guessRepository.save(guess);

        // Notifier les autres joueurs qu'une tentative a été faite
        String roomCode = round.getGame().getRoom().getCode();
        int numeroEssai = tentativesPrecedentes.size() + 1;
        notificationService.notifyGuessMade(roomCode, user.getUsername(), numeroEssai, estCorrect);

        // Vérifier si tous les joueurs ont fini → transition automatique
        gameService.checkAndAdvanceRound(roundId);

        return savedGuess;
    }

    public List<Guess> getGuessesByRound(Long roundId) {
        return guessRepository.findByRoundId(roundId);
    }

    public List<Guess> getGuessesByRoundAndUser(Long roundId, Long userId) {
        return guessRepository.findByRoundIdAndUserId(roundId, userId);
    }

    private String evaluerTentative(String tentative, String cible) {
        int length = cible.length();
        char[] resultat = new char[length];
        boolean[] cibleMatch = new boolean[length];
        boolean[] tentativeMatch = new boolean[length];

        // 1. Lettres bien placées (Correct)
        for (int i = 0; i < length; i++) {
            if (tentative.charAt(i) == cible.charAt(i)) {
                resultat[i] = 'C';
                cibleMatch[i] = true;
                tentativeMatch[i] = true;
            }
        }

        // 2. Lettres mal placées (Present) et Absentes (Absent)
        for (int i = 0; i < length; i++) {
            if (!tentativeMatch[i]) {
                char charCourant = tentative.charAt(i);
                boolean trouve = false;
                for (int j = 0; j < length; j++) {
                    if (!cibleMatch[j] && cible.charAt(j) == charCourant) {
                        resultat[i] = 'P';
                        cibleMatch[j] = true;
                        trouve = true;
                        break; // On a trouvé une correspondance, on arrête de chercher
                    }
                }
                if (!trouve) {
                    resultat[i] = 'A';
                }
            }
        }

        // Convertir en String "C,A,P,C,A"
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(resultat[i]);
            if (i < length - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }
}
