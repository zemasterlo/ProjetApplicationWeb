// ============================================================
// services/websocket.ts — STOMP over SockJS
// Backend: /ws endpoint → /topic/room/{code}
// ============================================================

import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export type WsMessageType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'GAME_STARTED'
  | 'GUESS_MADE'
  | 'ROUND_ENDED'
  | 'NEW_ROUND'
  | 'GAME_ENDED'
  | 'NEW_MESSAGE'

export interface WsMessage {
  type: WsMessageType
  data: Record<string, any>
}

type Handler = (msg: WsMessage) => void

class WebSocketService {
  private client: Client | null = null
  private handlers: Handler[] = []

  connect(roomCode: string, onMessage: Handler) {
    this.disconnect()
    this.handlers = [onMessage]

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        this.client!.subscribe(`/topic/room/${roomCode}`, (frame: IMessage) => {
          try {
            const msg: WsMessage = JSON.parse(frame.body)
            this.handlers.forEach(h => h(msg))
          } catch (e) {
            console.error('WS parse error:', e)
          }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
      },
    })

    this.client.activate()
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate()
      this.client = null
    }
    this.handlers = []
  }

  addHandler(handler: Handler) {
    this.handlers.push(handler)
  }

  removeHandler(handler: Handler) {
    this.handlers = this.handlers.filter(h => h !== handler)
  }

  get isConnected() {
    return this.client?.connected ?? false
  }
}

export const wsService = new WebSocketService()
