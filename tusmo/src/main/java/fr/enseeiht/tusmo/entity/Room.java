package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;


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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id")
    @ToString.Exclude
    private User owner;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "room_players",
        joinColumns = @JoinColumn(name = "room_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonProperty("joueurs")
    @Builder.Default
    private List<User> players = new ArrayList<>();
}
