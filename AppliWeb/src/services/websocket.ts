import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private onMessageReceived: (msg: any) => void = () => {};

  connect(roomId: string, callback: (msg: any) => void) {
    this.onMessageReceived = callback;
    
    this.client = new Client({
      // Utilisation de SockJS qui est super robuste avec Spring Boot
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connecté au WebSocket', frame);
      // On s'abonne à un topic géré par Spring Boot (ex: @SendTo("/topic/room/1"))
      this.client?.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
        if (message.body) {
          const parsed = JSON.parse(message.body);
          this.onMessageReceived(parsed);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Erreur STOMP:', frame.headers['message']);
      console.error('Détails:', frame.body);
    };

    this.client.activate();
  }

  sendMessage(roomId: string, message: any) {
    if (this.client && this.client.connected) {
      // Envoyer un message vers le controller Spring Boot (ex: @MessageMapping("/chat.sendMessage"))
      this.client.publish({
        destination: `/app/chat/${roomId}`,
        body: JSON.stringify(message),
      });
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      console.log('Déconnecté du WebSocket');
    }
  }
}

export const wsService = new WebSocketService();
