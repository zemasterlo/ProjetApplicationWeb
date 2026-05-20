package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.entity.User;
import fr.enseeiht.tusmo.entity.UserStatus;
import fr.enseeiht.tusmo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

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

        User user = User.builder()
                .username(username)
                .email(email)
                .password(hashPassword(rawPassword))
                .dateInscription(LocalDateTime.now())
                .statut(UserStatus.OFFLINE)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User loginUser(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Nom d'utilisateur ou mot de passe incorrect."));

        String hashedInput = hashPassword(password);
        if (!hashedInput.equals(user.getPassword())) {
            throw new IllegalArgumentException("Nom d'utilisateur ou mot de passe incorrect.");
        }

       
        user.setStatut(UserStatus.ONLINE);
        userRepository.save(user);

        return user;
    }

    @Transactional
    public void logoutUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setStatut(UserStatus.OFFLINE);
        userRepository.save(user);
    }

    @Transactional
    public void updateUserStatus(Long userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setStatut(newStatus);
        userRepository.save(user);
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur lors du hashage du mot de passe", e);
        }
    }
}
