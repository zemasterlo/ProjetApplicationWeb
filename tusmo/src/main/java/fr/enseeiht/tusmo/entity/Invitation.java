package fr.enseeiht.tusmo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    private User expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id")
    @ToString.Exclude
    @JsonIgnore
    private User destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    @ToString.Exclude
    @JsonIgnore
    private Room room;

    @Enumerated(EnumType.STRING)
    private InvitationStatus statut;

    private LocalDateTime dateEnvoi;
}
