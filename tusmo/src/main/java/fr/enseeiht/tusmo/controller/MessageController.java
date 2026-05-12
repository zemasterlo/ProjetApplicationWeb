package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Message;
import fr.enseeiht.tusmo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<Message> sendMessage(
            @RequestParam Long roomId, 
            @RequestParam Long userId, 
            @RequestParam String contenu) {
        return ResponseEntity.ok(messageService.sendMessage(roomId, userId, contenu));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Message>> getRoomMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(messageService.getRoomMessages(roomId));
    }
}
