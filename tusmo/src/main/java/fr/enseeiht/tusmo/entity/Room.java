package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    @Column(nullable = false, unique = true, length = 6)
    private String code;

    @Enumerated(EnumType.STRING)
    private RoomStatus statut;

    private LocalDateTime dateCreation;
    
    private int maxJoueurs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @ToString.Exclude
    @JsonIgnore
    private User owner;
}
