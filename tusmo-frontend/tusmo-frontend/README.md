# TUSMO Frontend — Setup

## Stack
- React 18 + TypeScript
- Vite (dev server + proxy)
- STOMP/SockJS (WebSocket)
- React Router v6

## Installation

```bash
npm install
npm run dev
```

Le frontend tourne sur **http://localhost:3000**.  
Le proxy Vite redirige `/api` et `/ws` vers `http://localhost:8080`.

## Structure

```
src/
├── context/
│   └── AuthContext.tsx     # Gestion utilisateur (sessionStorage)
├── hooks/
│   └── useToast.tsx        # Notifications toast
├── components/
│   └── Navbar.tsx          # Barre de navigation
├── pages/
│   ├── LoginPage.tsx       # Connexion / Inscription
│   ├── LobbyPage.tsx       # Liste des salles, créer/rejoindre
│   ├── RoomPage.tsx        # Salle d'attente avant la partie
│   └── GamePage.tsx        # ⭐ Page de jeu principale
├── services/
│   ├── api.ts              # Tous les appels REST
│   └── websocket.ts        # Service STOMP/SockJS
└── styles/
    └── global.css          # Design system complet
```

## Corrections apportées vs version précédente

### Bug 1 — Grille avec 6 lettres au lieu de 5
L'utilisateur tape désormais uniquement les lettres **après** la première :
- Input limité à `longueurMot - 1` caractères
- La première lettre est affichée en préfixe visuel (case verte)
- Le frontend préfixe avant d'envoyer : `premiereLettre + input`

### Bug 2 — Lignes vides après rechargement
La reconstruction de la grille est maintenant **atomique** :
- `buildGridFromGuesses()` construit toute la grille en une seule passe
- Plus de race condition entre `initGrid()` et le `setGrid()` des guesses existants

### Autres améliorations
- `handleWebSocketMessage` encapsulé dans `useCallback` (plus de valeurs stales)
- `useAuth` avec `sessionStorage` (plus de `localStorage` brut)
- Clavier virtuel qui trace les lettres déjà jouées
- Leaderboard affiché en fin de partie via `GAME_ENDED`
- Animations : flip des cellules, shake sur erreur

## WebSocket events attendus du backend

| Type           | Données attendues                                                   |
|----------------|---------------------------------------------------------------------|
| `GAME_STARTED` | `roundId`, `premiereLettre`, `longueurMot`, `numeroRound`, `nombreRoundsTotal` |
| `NEW_ROUND`    | idem + `roundId`                                                    |
| `GUESS_MADE`   | `username`, `numeroEssai`, `estCorrect`                             |
| `ROUND_ENDED`  | `numeroRound`, `motCorrect`                                         |
| `GAME_ENDED`   | (vide suffisant)                                                    |
| `NEW_MESSAGE`  | `username`, `contenu`                                               |
| `PLAYER_JOINED`/`PLAYER_LEFT` | `username`                                         |
