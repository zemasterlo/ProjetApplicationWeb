package fr.enseeiht.tusmo.service;

import fr.enseeiht.tusmo.dto.RoundHintDTO;
import fr.enseeiht.tusmo.dto.WebSocketMessage;
import fr.enseeiht.tusmo.dto.WebSocketMessage.EventType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        
        private void sendToRoom(String roomCode, WebSocketMessage message) {
                messagingTemplate.convertAndSend("/topic/room/" + roomCode, message);
        }

        public void notifyPlayerJoined(String roomCode, String username) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.PLAYER_JOINED)
                                .message(username + " a rejoint la salle")
                                .data(Map.of("username", username))
                                .build());
        }

        public void notifyPlayerLeft(String roomCode, String username) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.PLAYER_LEFT)
                                .message(username + " a quitté la salle")
                                .data(Map.of("username", username))
                                .build());
        }

        public void notifyGameStarted(String roomCode, Long gameId, RoundHintDTO hint, int nombreRoundsTotal) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.GAME_STARTED)
                                .message("La partie commence !")
                                .data(Map.of(
                                                "gameId", gameId,
                                                "roundId", hint.getRoundId(),
                                                "premiereLettre", String.valueOf(hint.getPremiereLettre()),
                                                "longueurMot", hint.getLongueurMot(),
                                                "numeroRound", hint.getNumeroRound(),
                                                "nombreRoundsTotal", nombreRoundsTotal))
                                .build());
        }

        public void notifyGuessMade(String roomCode, String username, int numeroEssai, boolean estCorrect) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.GUESS_MADE)
                                .message(username + " a fait sa tentative n°" + numeroEssai)
                                .data(Map.of(
                                                "username", username,
                                                "numeroEssai", numeroEssai,
                                                "estCorrect", estCorrect))
                                .build());
        }

        public void notifyRoundEnded(String roomCode, int numeroRound, String motCorrect) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.ROUND_ENDED)
                                .message("Round " + numeroRound + " terminé ! Le mot était : " + motCorrect)
                                .data(Map.of(
                                                "numeroRound", numeroRound,
                                                "motCorrect", motCorrect))
                                .build());
        }

        public void notifyNewRound(String roomCode, RoundHintDTO hint) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.NEW_ROUND)
                                .message("Round " + hint.getNumeroRound() + " commence !")
                                .data(Map.of(
                                                "roundId", hint.getRoundId(),
                                                "premiereLettre", String.valueOf(hint.getPremiereLettre()),
                                                "longueurMot", hint.getLongueurMot(),
                                                "numeroRound", hint.getNumeroRound()))
                                .build());
        }

        public void notifyGameEnded(String roomCode, List<Map<String, Object>> classement) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.GAME_ENDED)
                                .message("Partie terminée !")
                                .data(Map.of("classement", classement))
                                .build());
        }

        public void notifyNewMessage(String roomCode, String username, String contenu) {
                sendToRoom(roomCode, WebSocketMessage.builder()
                                .type(EventType.NEW_MESSAGE)
                                .message(username + ": " + contenu)
                                .data(Map.of(
                                                "username", username,
                                                "contenu", contenu))
                                .build());
        }


        public void notifyInvitationReceived(Long destinataireId, String expediteurUsername,
                        String roomNom, String roomCode, Long invitationId) {
                messagingTemplate.convertAndSend("/topic/user/" + destinataireId,
                                WebSocketMessage.builder()
                                                .type(EventType.INVITATION_RECEIVED)
                                                .message(expediteurUsername + " t'invite à rejoindre " + roomNom)
                                                .data(Map.of(
                                                                "invitationId", invitationId,
                                                                "expediteurUsername", expediteurUsername,
                                                                "roomNom", roomNom,
                                                                "roomCode", roomCode))
                                                .build());
        }
}
