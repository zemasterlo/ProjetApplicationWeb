package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.entity.UserStatus;
import fr.enseeiht.tusmo.service.UserService;
import fr.enseeiht.tusmo.repository.UserRepository;
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
}
