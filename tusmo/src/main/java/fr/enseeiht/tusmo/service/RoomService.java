package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.entity.RoomStatus;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.RoomRepository;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Room createRoom(String nom, int maxJoueurs, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Propriétaire non trouvé"));

        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        
        Room room = Room.builder()
                .nom(nom)
                .code(code)
                .statut(RoomStatus.WAITING)
                .dateCreation(LocalDateTime.now())
                .maxJoueurs(maxJoueurs)
                .owner(owner)
                .build();               
        return roomRepository.save(room);
    }

    public List<Room> getWaitingRooms() {
        return roomRepository.findByStatut(RoomStatus.WAITING);
    }

    public Optional<Room> getRoomByCode(String code) {
        return roomRepository.findByCode(code.toUpperCase());
    }

    @Transactional
    public Room joinRoom(String code, Long userId) {
        Room room = roomRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Salle introuvable avec ce code."));
        
        if (room.getStatut() != RoomStatus.WAITING) {
            throw new IllegalStateException("La partie a déjà commencé ou est terminée.");
        }

        if (room.getPlayers().size() >= room.getMaxJoueurs()) {
            throw new IllegalStateException("La salle est complète.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable."));

        if (!room.getPlayers().contains(user)) {
            room.getPlayers().add(user);
            roomRepository.save(room);
            notificationService.notifyPlayerJoined(room.getCode(), user.getUsername());
        }

        return room;
    }

    @Transactional
    public Room leaveRoom(String code, Long userId) {
        Room room = roomRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Salle introuvable avec ce code."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable."));

        if (!room.getPlayers().contains(user)) {
            throw new IllegalStateException("Ce joueur n'est pas dans cette salle.");
        }

        // Retirer le joueur de la liste
        room.getPlayers().remove(user);

        // Si c'est le propriétaire qui quitte
        if (room.getOwner().getId().equals(userId)) {
            if (room.getPlayers().isEmpty()) {
                // Plus personne dans la salle → on la ferme
                room.setStatut(RoomStatus.CLOSED);
            } else {
                // Transférer la propriété au premier joueur restant
                room.setOwner(room.getPlayers().get(0));
            }
        }

        Room savedRoom = roomRepository.save(room);

        notificationService.notifyPlayerLeft(room.getCode(), user.getUsername());

        return savedRoom;
    }
}
