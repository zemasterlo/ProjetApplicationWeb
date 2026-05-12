package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findByGameIdOrderByPointsDesc(Long gameId);
    Optional<Score> findByUserIdAndGameId(Long userId, Long gameId);
}
