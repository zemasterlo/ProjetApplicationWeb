package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "rounds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Round {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    @ToString.Exclude
    @JsonIgnore
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id")
    @ToString.Exclude
    @JsonIgnore
    private Word word;

    private int numeroRound;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
}
