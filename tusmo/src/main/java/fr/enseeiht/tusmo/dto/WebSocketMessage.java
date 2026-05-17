package fr.enseeiht.tusmo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {

    public enum EventType {
        PLAYER_JOINED,
        PLAYER_LEFT,
        GAME_STARTED,
        GUESS_MADE,
        ROUND_ENDED,
        NEW_ROUND,
        GAME_ENDED,
        NEW_MESSAGE
    }

    private EventType type;
    private String message;
    private Map<String, Object> data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
