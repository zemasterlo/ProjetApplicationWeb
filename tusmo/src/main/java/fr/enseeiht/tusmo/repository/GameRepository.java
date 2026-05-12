package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Game;
import fr.enseeiht.tusmo.entity.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByRoomId(Long roomId);
    Optional<Game> findByRoomIdAndStatut(Long roomId, GameStatus statut);
}
