package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Guess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuessRepository extends JpaRepository<Guess, Long> {
    List<Guess> findByRoundId(Long roundId);
    List<Guess> findByRoundIdAndUserId(Long roundId, Long userId);
    List<Guess> findByRoundIdAndEstCorrectTrue(Long roundId);
}
