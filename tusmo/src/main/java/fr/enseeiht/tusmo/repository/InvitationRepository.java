package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Invitation;
import fr.enseeiht.tusmo.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    List<Invitation> findByDestinataireIdAndStatut(Long destinataireId, InvitationStatus statut);
    List<Invitation> findByExpediteurId(Long expediteurId);
    Optional<Invitation> findByDestinataireIdAndRoomId(Long destinataireId, Long roomId);
}
