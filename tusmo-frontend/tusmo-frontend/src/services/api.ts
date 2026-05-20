

const BASE = '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw Object.assign(new Error(msg), { status: res.status })
  }
  const text = await res.text()
  return text ? JSON.parse(text) : (null as T)
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) p.append(k, String(v))
  }
  return p.toString()
}


export const userService = {
  register: (username: string, email: string, password: string) =>
    request<User>(`/users/register?${qs({ username, email, password })}`, { method: 'POST' }),

  login: (username: string, password: string) =>
    request<User>(`/users/login?${qs({ username, password })}`, { method: 'POST' }),

  logout: (id: number) =>
    request<void>(`/users/${id}/logout`, { method: 'POST' }),

  getUser: (id: number) =>
    request<User>(`/users/${id}`),

  searchByUsername: (username: string) =>
    request<User>(`/users/search?${qs({ username })}`),

  getOnline: () =>
    request<User[]>(`/users/online`),
}


export const roomService = {
  getWaiting: () =>
    request<Room[]>('/rooms/waiting'),

  getRoom: (id: string | number) =>
    request<Room>(`/rooms/${id}`),

  createRoom: (nom: string, ownerId: number, maxJoueurs: number) =>
    request<Room>(`/rooms/create?${qs({ nom, ownerId, maxJoueurs })}`, { method: 'POST' }),

  joinRoom: (code: string, userId: number) =>
    request<Room>(`/rooms/join?${qs({ code, userId })}`, { method: 'POST' }),

  leaveRoom: (code: string, userId: number) =>
    request<Room>(`/rooms/leave?${qs({ code, userId })}`, { method: 'POST' }),
}

export const gameService = {
  startGame: (roomId: number, nombreRounds: number) =>
    request<Game>(`/games/start?${qs({ roomId, nombreRounds })}`, { method: 'POST' }),

  endGame: (gameId: number) =>
    request<void>(`/games/${gameId}/end`, { method: 'POST' }),

  getHistory: (roomId: number) =>
    request<any[]>(`/games/room/${roomId}`),

  getActiveGameState: (roomId: number, userId: number) =>
    request<ActiveGameState | null>(`/games/room/${roomId}/active?${qs({ userId })}`),
}


export const roundService = {
  startNext: (gameId: number, numeroRound: number) =>
    request<Round>(`/rounds/start-next?${qs({ gameId, numeroRound })}`, { method: 'POST' }),

  getHint: (roundId: number) =>
    request<RoundHint>(`/rounds/${roundId}/hint`),

  endRound: (roundId: number) =>
    request<Round>(`/rounds/${roundId}/end`, { method: 'POST' }),
}


export const guessService = {
  submit: (roundId: number, userId: number, motPropose: string) =>
    request<Guess>(`/guesses?${qs({ roundId, userId, motPropose })}`, { method: 'POST' }),

  getByRoundAndUser: (roundId: number, userId: number) =>
    request<Guess[]>(`/guesses/round/${roundId}/user/${userId}`),
}


export const messageService = {
  send: (roomId: number, userId: number, contenu: string) =>
    request<Message>(`/messages?${qs({ roomId, userId, contenu })}`, { method: 'POST' }),

  getRoom: (roomId: number) =>
    request<Message[]>(`/messages/room/${roomId}`),
}

export const invitationService = {
  send: (expediteurId: number, destinataireId: number, roomId: number) =>
    request<Invitation>(`/invitations/send?${qs({ expediteurId, destinataireId, roomId })}`, { method: 'POST' }),

  getPending: (destinataireId: number) =>
    request<Invitation[]>(`/invitations/pending/${destinataireId}`),

  accept: (invitationId: number) =>
    request<Invitation>(`/invitations/${invitationId}/accept`, { method: 'POST' }),

  refuse: (invitationId: number) =>
    request<Invitation>(`/invitations/${invitationId}/refuse`, { method: 'POST' }),
}

export const scoreService = {
  getLeaderboard: (gameId: number) =>
    request<Score[]>(`/scores/game/${gameId}/leaderboard`),

  record: (userId: number, gameId: number, tempsTotalSecondes: number, nombreEssais: number) =>
    request<Score>(`/scores?${qs({ userId, gameId, tempsTotalSecondes, nombreEssais })}`, { method: 'POST' }),
}

export interface User {
  id: number
  username: string
  email: string
  status: string
}

export interface Room {
  id: number
  nom: string
  code: string
  status: string
  maxJoueurs: number
  owner: User
  joueurs: User[]
}

export interface Game {
  id: number
  status: string
  nombreRoundsTotal: number
}

export interface Round {
  id: number
  numeroRound: number
}

export interface RoundHint {
  premiereLettre: string
  longueurMot: number
}

export interface Guess {
  id: number
  motPropose: string
  resultatLettres: string
  estCorrect: boolean
  numeroEssai: number
}

export interface Message {
  id: number
  contenu: string
  user: User
  heureEnvoi: string
}

export interface Invitation {
  id: number
  status: string
  expediteur: User
  room: Room
}

export interface Score {
  id: number
  user: User
  points: number
  tempsTotalSecondes: number
  nombreEssais: number
}

export interface ActiveGameState {
  gameId: number
  roundId: number
  premiereLettre: string
  longueurMot: number
  numeroRound: number
  nombreRoundsTotal: number
  guesses: Guess[]
}
