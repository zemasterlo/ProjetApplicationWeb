package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "words")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Word {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String mot;

    private int longueur;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulte;
}
