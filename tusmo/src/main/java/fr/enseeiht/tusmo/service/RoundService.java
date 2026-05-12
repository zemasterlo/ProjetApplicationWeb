package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Round;
import fr.enseeiht.tusmo.repository.RoundRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RoundService {

    @Autowired
    private RoundRepository roundRepository;

    public Optional<Round> getRoundById(Long roundId) {
        return roundRepository.findById(roundId);
    }

    public List<Round> getRoundsByGame(Long gameId) {
        return roundRepository.findByGameId(gameId);
    }

    public Optional<Round> getRoundByGameAndNumber(Long gameId, int numeroRound) {
        return roundRepository.findByGameIdAndNumeroRound(gameId, numeroRound);
    }

    @Transactional
    public Round endRound(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round introuvable"));
        
        round.setDateFin(LocalDateTime.now());
        return roundRepository.save(round);
    }
}
