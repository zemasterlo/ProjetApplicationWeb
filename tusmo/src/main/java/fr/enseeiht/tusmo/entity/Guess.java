package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "guesses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Guess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id")
    @ToString.Exclude
    @JsonIgnore
    private Round round;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @ToString.Exclude
    @JsonIgnore
    private User user;

    private String motPropose;
    private LocalDateTime dateGuess;
    private boolean estCorrect;
}
