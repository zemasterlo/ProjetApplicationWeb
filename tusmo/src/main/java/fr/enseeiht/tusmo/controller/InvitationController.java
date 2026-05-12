package fr.enseeiht.tusmo.controller;

import fr.enseeiht.tusmo.entity.Invitation;
import fr.enseeiht.tusmo.service.InvitationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    @Autowired
    private InvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<?> sendInvitation(
            @RequestParam Long expediteurId,
            @RequestParam Long destinataireId,
            @RequestParam Long roomId) {
        try {
            Invitation inv = invitationService.sendInvitation(expediteurId, destinataireId, roomId);
            return ResponseEntity.ok(inv);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/pending/{destinataireId}")
    public ResponseEntity<List<Invitation>> getPendingInvitations(@PathVariable Long destinataireId) {
        return ResponseEntity.ok(invitationService.getPendingInvitations(destinataireId));
    }

    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<Invitation> acceptInvitation(@PathVariable Long invitationId) {
        return ResponseEntity.ok(invitationService.acceptInvitation(invitationId));
    }

    @PostMapping("/{invitationId}/refuse")
    public ResponseEntity<Invitation> refuseInvitation(@PathVariable Long invitationId) {
        return ResponseEntity.ok(invitationService.refuseInvitation(invitationId));
    }
}
