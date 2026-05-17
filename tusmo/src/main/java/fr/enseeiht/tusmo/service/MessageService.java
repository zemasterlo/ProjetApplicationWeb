package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.Message;
import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.repository.MessageRepository;
import fr.enseeiht.tusmo.repository.RoomRepository;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Message sendMessage(Long roomId, Long userId, String contenu) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Salle introuvable"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Joueur introuvable"));

        Message message = Message.builder()
                .room(room)
                .user(user)
                .contenu(contenu)
                .dateEnvoi(LocalDateTime.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        notificationService.notifyNewMessage(room.getCode(), user.getUsername(), contenu);

        return savedMessage;
    }

    public List<Message> getRoomMessages(Long roomId) {
        return messageRepository.findByRoomIdOrderByDateEnvoiAsc(roomId);
    }
}
