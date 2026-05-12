package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.entity.UserStatus;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User registerUser(String username, String email, String rawPassword) {

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Ce nom d'utilisateur est déjà pris.");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Cet email est déjà utilisé.");
        }

        // Création de l'utilisateur
        User user = User.builder()
                .username(username)
                .email(email)
                .password(rawPassword) 
                .dateInscription(LocalDateTime.now())
                .statut(UserStatus.OFFLINE)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public void updateUserStatus(Long userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setStatut(newStatus);
        userRepository.save(user);
    }
}
