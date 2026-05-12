package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByCode(String code);
    List<Room> findByStatut(RoomStatus statut);
    List<Room> findByOwnerId(Long ownerId);
}
