package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "invitations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id")
    @ToString.Exclude
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "invitations", "rooms"})
    private User expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id")
    @ToString.Exclude
    @JsonIgnore
    private User destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    @ToString.Exclude
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "players", "owner", "games"})
    private Room room;

    @Enumerated(EnumType.STRING)
    private InvitationStatus statut;

    private LocalDateTime dateEnvoi;
}