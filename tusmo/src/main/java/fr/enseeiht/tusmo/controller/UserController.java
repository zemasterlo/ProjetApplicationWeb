package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.entity.UserStatus;
import fr.enseeiht.tusmo.service.UserService;
import fr.enseeiht.tusmo.repository.UserRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password) {
        try {
            User newUser = userService.registerUser(username, email, password);
            return ResponseEntity.ok(newUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestParam String username,
            @RequestParam String password) {
        try {
            User user = userService.loginUser(username, password);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/logout")
    public ResponseEntity<Void> logout(@PathVariable Long id) {
        try {
            userService.logoutUser(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        userService.updateUserStatus(id, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Recherche un utilisateur par son pseudo exact (pour le système d'invitation).
     * GET /api/users/search?username=alice
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchByUsername(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Retourne tous les utilisateurs en ligne (pour l'autocomplétion future).
     * GET /api/users/online
     */
    @GetMapping("/online")
    public ResponseEntity<List<User>> getOnlineUsers() {
        return ResponseEntity.ok(
                userRepository.findByStatut(fr.enseeiht.tusmo.entity.UserStatus.ONLINE));
    }
}
