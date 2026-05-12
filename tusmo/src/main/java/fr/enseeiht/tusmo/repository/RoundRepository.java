package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByGameId(Long gameId);
    Optional<Round> findByGameIdAndNumeroRound(Long gameId, int numeroRound);
}
