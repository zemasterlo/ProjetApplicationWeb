package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Room;
import fr.enseeiht.tusmo.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping("/create")
    public ResponseEntity<Room> createRoom(@RequestParam String nom, @RequestParam Long ownerId, @RequestParam int maxJoueurs) {
        Room room = roomService.createRoom(nom, maxJoueurs, ownerId);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/waiting")
    public ResponseEntity<List<Room>> getWaitingRooms() {
        return ResponseEntity.ok(roomService.getWaitingRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoom(@PathVariable Long id) {
        return roomService.getRoomById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestParam String code, @RequestParam Long userId) {
        try {
            Room room = roomService.joinRoom(code, userId);
            return ResponseEntity.ok(room);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<?> leaveRoom(@RequestParam String code, @RequestParam Long userId) {
        try {
            Room room = roomService.leaveRoom(code, userId);
            return ResponseEntity.ok(room);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
