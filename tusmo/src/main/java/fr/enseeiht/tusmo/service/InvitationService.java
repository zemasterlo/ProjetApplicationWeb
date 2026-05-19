package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Invitation;
import fr.enseeiht.tusmo.entity.InvitationStatus;
import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.InvitationRepository;
import fr.enseeiht.tusmo.repository.RoomRepository;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InvitationService {

    @Autowired
    private InvitationRepository invitationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Invitation sendInvitation(Long expediteurId, Long destinataireId, Long roomId) {
        User expediteur = userRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("Expéditeur introuvable"));
        User destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new RuntimeException("Destinataire introuvable"));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));

        Optional<Invitation> existingInv = invitationRepository.findByDestinataireIdAndRoomId(destinataireId, roomId);
        if (existingInv.isPresent() && existingInv.get().getStatut() == InvitationStatus.PENDING) {
            throw new IllegalStateException("Une invitation est déjà en attente pour ce joueur et cette salle.");
        }

        Invitation invitation = Invitation.builder()
                .expediteur(expediteur)
                .destinataire(destinataire)
                .room(room)
                .statut(InvitationStatus.PENDING)
                .dateEnvoi(LocalDateTime.now())
                .build();

        Invitation saved = invitationRepository.save(invitation);

        // Notifier le destinataire en temps réel via WebSocket
        notificationService.notifyInvitationReceived(
                destinataireId,
                expediteur.getUsername(),
                room.getNom(),
                room.getCode(),
                saved.getId()
        );

        return saved;
    }

    public List<Invitation> getPendingInvitations(Long destinataireId) {
        return invitationRepository.findByDestinataireIdAndStatut(destinataireId, InvitationStatus.PENDING);
    }

    @Transactional
    public Invitation acceptInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation introuvable"));
        
        invitation.setStatut(InvitationStatus.ACCEPTED);
        return invitationRepository.save(invitation);
    }

    @Transactional
    public Invitation refuseInvitation(Long invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation introuvable"));
        
        invitation.setStatut(InvitationStatus.REFUSED);
        return invitationRepository.save(invitation);
    }
}
