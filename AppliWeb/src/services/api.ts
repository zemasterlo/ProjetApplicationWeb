import axios from 'axios';

// --- MODIFICATION : Configuration de l'URL de base de l'API ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/tusmo-0.0.1-SNAPSHOT/ws';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- MODIFICATION : Ajout de tous les services liés à tes controllers Spring Boot ---

export const userService = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/users/register', null, { params: { username, email, password } });
    return response.data;
  },
  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/users/${id}/status`, null, { params: { status } });
    return response.data;
  },
  // endpoint fictif si géré par Spring Security, ou à adapter
  login: async (credentials: any) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  }
};

export const roomService = {
  createRoom: async (nom: string, ownerId: number, maxJoueurs: number) => {
    const response = await api.post('/rooms/create', null, { params: { nom, ownerId, maxJoueurs } });
    return response.data;
  },
  getWaitingRooms: async () => {
    const response = await api.get('/rooms/waiting');
    return response.data;
  },
  getRoom: async (id: string) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },
  joinRoom: async (code: string, userId: number) => {
    const response = await api.post('/rooms/join', null, { params: { code, userId } });
    return response.data;
  }
};

export const gameService = {
  startGame: async (roomId: number) => {
    const response = await api.post('/games/start', null, { params: { roomId } });
    return response.data;
  },
  endGame: async (gameId: number) => {
    const response = await api.post(`/games/${gameId}/end`);
    return response.data;
  },
  getGamesHistory: async (roomId: number) => {
    const response = await api.get(`/games/room/${roomId}`);
    return response.data;
  }
};

export const roundService = {
  startNextRound: async (gameId: number, numeroRound: number) => {
    const response = await api.post('/rounds/start-next', null, { params: { gameId, numeroRound } });
    return response.data;
  },
  endRound: async (roundId: number) => {
    const response = await api.post(`/rounds/${roundId}/end`);
    return response.data;
  }
};

export const guessService = {
  faireTentative: async (roundId: number, userId: number, motPropose: string) => {
    const response = await api.post('/guesses', null, { params: { roundId, userId, motPropose } });
    return response.data;
  },
  getGuessesByRound: async (roundId: number) => {
    const response = await api.get(`/guesses/round/${roundId}`);
    return response.data;
  },
  getGuessesByRoundAndUser: async (roundId: number, userId: number) => {
    const response = await api.get(`/guesses/round/${roundId}/user/${userId}`);
    return response.data;
  }
};

export const messageService = {
  sendMessage: async (roomId: number, userId: number, contenu: string) => {
    const response = await api.post('/messages', null, { params: { roomId, userId, contenu } });
    return response.data;
  },
  getRoomMessages: async (roomId: number) => {
    const response = await api.get(`/messages/room/${roomId}`);
    return response.data;
  }
};

export const scoreService = {
  recordScore: async (userId: number, gameId: number, tempsTotalSecondes: number, nombreEssais: number) => {
    const response = await api.post('/scores', null, { params: { userId, gameId, tempsTotalSecondes, nombreEssais } });
    return response.data;
  },
  getLeaderboard: async (gameId: number) => {
    const response = await api.get(`/scores/game/${gameId}/leaderboard`);
    return response.data;
  },
  getPlayerScore: async (userId: number, gameId: number) => {
    const response = await api.get(`/scores/user/${userId}/game/${gameId}`);
    return response.data;
  }
};

export const invitationService = {
  sendInvitation: async (expediteurId: number, destinataireId: number, roomId: number) => {
    const response = await api.post('/invitations/send', null, { params: { expediteurId, destinataireId, roomId } });
    return response.data;
  },
  getPendingInvitations: async (destinataireId: number) => {
    const response = await api.get(`/invitations/pending/${destinataireId}`);
    return response.data;
  },
  acceptInvitation: async (invitationId: number) => {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data;
  },
  refuseInvitation: async (invitationId: number) => {
    const response = await api.post(`/invitations/${invitationId}/refuse`);
    return response.data;
  }
};
