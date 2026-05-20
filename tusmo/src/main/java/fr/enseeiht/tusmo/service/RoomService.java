package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Game;
import fr.enseeiht.tusmo.entity.GameStatus;
import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.entity.RoomStatus;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.GameRepository;
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
    private GameRepository gameRepository;

    @Autowired
    private GameService gameService;

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
        
      
        room.getPlayers().add(owner);
        
        return roomRepository.save(room);
    }

    @Transactional
    public List<Room> getWaitingRooms() {
        return roomRepository.findByStatut(RoomStatus.WAITING);
    }

    public Optional<Room> getRoomByCode(String code) {
        return roomRepository.findByCode(code.toUpperCase());
    }

    @Transactional
    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
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

        boolean dejaPresent = room.getPlayers().stream()
        .anyMatch(p -> p.getId().equals(user.getId()));
        if (!dejaPresent) {
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

        
        room.getPlayers().remove(user);

    
        if (room.getPlayers().isEmpty()) {
            notificationService.notifyPlayerLeft(room.getCode(), user.getUsername());
            gameRepository.findByRoomIdAndStatut(room.getId(), GameStatus.IN_PROGRESS)
                    .ifPresent(game -> gameService.endGame(game.getId()));
            room.setStatut(RoomStatus.CLOSED);
            roomRepository.save(room);
            return room;
        }

        
        if (room.getOwner().getId().equals(userId)) {
            room.setOwner(room.getPlayers().get(0));
        }

        Room savedRoom = roomRepository.save(room);

        notificationService.notifyPlayerLeft(room.getCode(), user.getUsername());

        return savedRoom;
    }
}