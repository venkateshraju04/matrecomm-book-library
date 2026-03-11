# 📚 Real-Time Book Manager

A full-stack real-time book management application built with **React · Express · Socket.IO · Tailwind CSS**.

Multiple users can add, edit, and delete books simultaneously — every change is broadcast to all connected clients instantly via WebSockets.

**Live Demo:** [https://realtime-book-library.up.railway.app/](https://realtime-book-library.up.railway.app/)
                [https://realtime-book.venkateshraju.me/](https://realtime-book.venkateshraju.me/)


---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Socket.IO Events Reference](#socketio-events-reference)
- [REST API Reference](#rest-api-reference)
- [Project Structure](#project-structure)
- [Running the Project Locally](#running-the-project-locally)
- [Testing Real-Time Updates](#testing-real-time-updates)
- [WebSocket Connection Handling](#websocket-connection-handling)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Monitoring and Post Deployment Checks](#monitoring-and-post-deployment-checks)
---

## Project Overview

Book Manager is a dashboard-style web application that demonstrates real-time communication between a server and multiple clients. When any user adds, edits, or deletes a book, every connected client receives the update immediately through WebSocket events — no polling, no page reload.

**How it works:**

The **backend** runs an Express server with Socket.IO attached to the same HTTP server. It stores books in an in-memory array (pre-seeded with 3 sample books), exposes a REST API for CRUD operations, and broadcasts every mutation as a Socket.IO event to all connected clients.

The **frontend** is a React application (built with Vite) that fetches the initial book list via REST, then subscribes to Socket.IO events to receive real-time additions, updates, and deletions. It also handles soft-locking, activity tracking, and online user counts — all over the same WebSocket connection.

---
<div style="page-break-before: always;"></div>

## Features

| Feature | Description |
|---|---|
| **Add books** | Submit a title and author via a form; the new book appears on all connected clients instantly. |
| **Edit books inline** | Click the edit button on any book card to modify its title or author in place. Save or cancel to finish. |
| **Delete books** | Remove a book while in edit mode; deletion is broadcast to all clients in real time. |
| **Soft locking** | When a user starts editing a book, other users see a lock indicator with the editor's name hence preventing conflicting edits. |
| **Lock auto-expiry** | Locks automatically expire after 15 seconds of inactivity. Stale locks from idle or disconnected users are cleaned up. |
| **Real-time activity feed** | A collapsible timeline showing recent add, update, and delete events with timestamps. Capped at 20 entries. |
| **Connected users counter** | A live count of currently connected clients displayed in the header, updated on every connect/disconnect. |
| **Live / Offline indicator** | A pulsing green "Live" badge or red "Offline" badge reflecting the current WebSocket connection state. |

---

## Tech Stack

**Frontend:** 
- React 18
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client

**Backend:** 
- Node.js 18+
- Express 4+
- Socket.IO
- CORS
- Nodemon

---

## Architecture

The application follows a modular client-server architecture. The frontend communicates with the backend through two channels:

1. **REST API (HTTP)** — For CRUD operations (`GET, POST, PUT, DELETE` on `/books`).
2. **WebSocket (Socket.IO)** — For real-time event broadcasting and `soft-lock` coordination.

```
┌────────────────────────────────────────────────────────────────────┐
│                        Client  (React + Vite)                      │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐     │
│  │ AddBook  │  │ BookList │  │ActivityFeed│  │   App.jsx     │     │
│  └─────┬────┘  └────┬─────┘  └─────┬──────┘  └────────┬──────┘     │
│        │            │              │                  │            │
│        └────────────┼──────────────┼──────────────────┘            │
│                     │              │                               │
│              axios (REST)    socket.io-client (WS)                 │
└─────────────────────┼──────────────┼───────────────────────────────┘
                      │              │
               HTTP request      WebSocket
                      │              │
                      ▼              ▼
┌─────────────────────┼──────────────┼──────────────────────────────┐
│                     │   Express +  │  Socket.IO  (Node.js)        │
│                     │              │                              │
│              ┌──────┴──────┐ ┌─────┴───────────┐                  │
│              │  REST API   │ │  Socket.IO      │                  │
│              │  /books     │ │  Events         │                  │
│              └──────┬──────┘ └─────┬───────────┘                  │
│                     │              │                              │
│              ┌──────┴──────┐ ┌─────┴───────────┐                  │
│              │ Controllers │ │ SocketHandler   │                  │
│              │ (validate,  │ │ (usersOnline,   │                  │
│              │  emit)      │ │  soft locks)    │                  │
│              └──────┬──────┘ └─────────────────┘                  │
│                     │                                             │
│              ┌──────┴──────┐                                      │
│              │  Services   │  (in-memory book store)              │
│              └─────────────┘                                      │
└───────────────────────────────────────────────────────────────────┘
```

### Backend Layer Responsibilities

| Layer | File | Responsibility |
|---|---|---|
| Routes | `bookRoutes.js` | Thin mapping of HTTP verbs to controller functions. Zero logic. |
| Controllers | `bookController.js` | Validate request body, call services, emit Socket.IO events, send HTTP response. |
| Services | `bookService.js` | Pure data-access layer. No knowledge of HTTP or WebSockets. Easy to swap for a real database. |
| Sockets | `socketHandler.js` | Manages connection lifecycle, `usersOnline` counter, and soft-lock state with auto-expiry timers. |

---

## Real-Time Event Flow

### Adding a Book

```
User (Tab A)            Server                      Other Users
  │                       │                              │
  │── POST /books ───────▶│                              │
  │                       │── bookService.createBook()   │                            │                       │                              │
  │                       │── io.emit('bookAdded') ─────▶│ → append to book list
  │                       │── io.emit('activity') ──────▶│ → prepend to feed
  │◀── 201 Created ───────│                              │
```

### Editing a Book (with Soft Lock)

```
User (Tab A)                Server                      Other Users
  │                           │                              │
  │── emit('startEditing') ──▶│                              │
  │                           │── editLocks.set(bookId)      │
  │                           │── broadcast('bookLocked') ──▶│ → show lock indicator
  │                           │── start 15s expiry timer     │
  │                           │                              │
  │  … user edits fields …    │                              │
  │                           │                              │
  │── PUT /books/:id ────────▶│                              │
  │                           │── bookService.updateBook()   │
  │                           │── io.emit('bookUpdated') ───▶│ → update in list
  │                           │── io.emit('activity') ──────▶│ → prepend to feed
  │◀── 200 OK ────────────────│                              │
  │                           │                              │
  │── emit('stopEditing') ───▶│                              │
  │                           │── editLocks.delete(bookId)   │
  │                           │── broadcast('bookUnlocked') ▶│ → remove lock indicator
```

## Socket.IO Events Reference

| Event | Direction | Payload | Description |
|---|---|---|---|
| `bookAdded` | Server → All clients | `{ id, title, author }` | A new book was created |
| `bookUpdated` | Server → All clients | `{ id, title, author }` | A book was modified |
| `bookDeleted` | Server → All clients | `{ id }` | A book was removed |
| `activity` | Server → All clients | `{ type, title, timestamp }` | Activity feed event (BOOK_ADDED, BOOK_UPDATED, BOOK_DELETED) |
| `usersOnline` | Server → All clients | `number` | Updated connected user count |
| `currentLocks` | Server → Newly connected client | `{ [bookId]: { socketId, userName } }` | Snapshot of all active edit locks |
| `bookLocked` | Server → Other clients | `{ bookId, userName }` | A book is now being edited by someone |
| `bookUnlocked` | Server → Other clients | `{ bookId }` | A book is no longer being edited |
| `lockExpired` | Server → Editing client | `{ bookId }` | The user's own lock auto-expired (15s timeout) |
| `startEditing` | Client → Server | `{ bookId, userName? }` | Client requests an edit lock |
| `stopEditing` | Client → Server | `{ bookId }` | Client releases an edit lock |


---

## REST API Reference

| Method | Endpoint | Request Body | Response | Description |
|---|---|---|---|---|
| GET | `/books` | — | `[ { id, title, author }, … ]` | List all books |
| POST | `/books` | `{ title, author }` | `{ id, title, author }` | Create a new book |
| PUT | `/books/:id` | `{ title, author }` | `{ id, title, author }` | Update an existing book |
| DELETE | `/books/:id` | — | `{ message, id }` | Delete a book |

**Validation:** Both `title` and `author` are required and trimmed. Returns `400` with `{ error }` if missing. Returns `404` if the book ID is not found on PUT / DELETE.

---
<div style="page-break-before: always;"></div>

## Project Structure

```
book-realtime-app/
├── package.json                      # scripts (build, start, install)
├── railway.json                      # Railway deployment configuration
├── .gitignore
│
├── backend/
│   ├── server.js                     # Express + Socket.IO entry point
│   ├── package.json                  # Backend dependencies & scripts
│   ├── .env.example                  # Environment variable template
│   ├── controllers/
│   │   └── bookController.js         # HTTP methods(GET, POST, PUT, DELETE)
│   ├── routes/
│   │   └── bookRoutes.js             # Express router → controller
│   ├── services/
│   │   └── bookService.js            # In-memory CRUD data store
│   └── sockets/
│       └── socketHandler.js          # Socket.IO lifecycle
│
└── frontend/
    ├── index.html                    
    ├── package.json                  
    ├── vite.config.js                
    ├── .env.example                  # Environment variable template
    └── src/
        ├── main.jsx                  
        ├── App.jsx                   # Root layout, state, socket
        ├── AddBook.jsx               # "Add a New Book" form component
        ├── BookList.jsx              # Card gallery with edit/delete
        ├── ActivityFeed.jsx          # real-time activity timeline
        ├── socket.js                 # Socket.IO client instance
        └── index.css                 
```

### Component Breakdown

| Component | File | Description |
|---|---|---|
| App | `App.jsx` | Root layout. Manages books, `isConnected`, `usersOnline` state. Registers all Socket.IO listeners. Renders header with status badges, AddBook + ActivityFeed row, and BookList grid. |
| AddBook | `AddBook.jsx` | Card form with title/author inputs and a gradient submit button. POSTs to the REST API; the server broadcasts the new book via socket. |
| BookList | `BookList.jsx` | Responsive card grid. Each book shows a gradient cover with initials. Handles inline editing, saving, deleting, and displays lock indicators for books being edited by others. |
| ActivityFeed | `ActivityFeed.jsx` | Collapsible timeline. Listens for `activity` socket events. Shows colored dots (green = added, amber = updated, red = deleted) with book title and timestamp. Max 20 entries. |
| socket | `socket.js` | Singleton Socket.IO client. Shared across all components to prevent duplicate connections. Configured with 5 reconnection attempts at 1s intervals. |

---

## Running the Project Locally

### Prerequisites

- **Node.js 18** or later
- **npm** (comes with Node.js)

> **macOS note:** Port 5000 is reserved by AirPlay Receiver on macOS Monterey+. This project uses port 5001 to avoid that conflict.

### 1. Extract the .zip file


### 2. Install and start the backend

```bash
cd backend
npm install
npm run dev
```

The backend starts at `http://localhost:5001` with auto-restart via Nodemon.

### 3. Install and start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Or, to make it accessible from other devices on your network:

```bash
npm run dev -- --host
```

Vite starts at `http://localhost:5173`. Open this URL in your browser.

### 4. Open the app

Visit `http://localhost:5173` — you should see the Book Manager dashboard with 3 pre-loaded books, a "Live" badge, and "1 online" counter.

---

## Testing Real-Time Updates

1. Open the app in two or more browser tabs (or devices on the same network).
2. **Add a book** in one tab → it appears in all other tabs instantly.
3. **Click Edit** on a book in Tab A → Tab B shows an orange "Editing" lock badge with a tooltip showing who is editing.
4. **Save the edit** → the updated title/author appears everywhere; the lock is released.
5. **Delete a book** → it disappears from all tabs simultaneously.
6. **Watch the activity feed** → every add, update, and delete event appears with a colored dot and timestamp.
7. **Check the user counter** → the "X online" pill in the header updates as tabs open or close.
8. **Test lock expiry** → start editing a book, do nothing for 15 seconds — the lock auto-releases and the edit form closes.
9. **Close a tab** → the user count decrements and any locks held by that tab are released.

### Testing Summary

The real-time functionality was tested using multiple browser tabs and devices on the same network.

**Results:**

- Book additions propagate instantly to all connected clients
- Book edits update in real time across all sessions
- Soft-lock system prevents conflicting edits and expires automatically after 15 seconds
- User counter updates correctly when clients connect or disconnect
- Activity feed records all events with timestamps
- WebSocket reconnection restores the live connection without manual refresh

These tests confirm that the backend successfully broadcasts updates to all connected clients and the frontend reflects those updates immediately.

---

## WebSocket Connection Handling

### Connection

The Socket.IO client is created as a singleton in `socket.js` — every component imports the same instance, preventing duplicate connections. On connect, the server increments `connectedUsers` and broadcasts `usersOnline` to all clients. The server sends `currentLocks` to the newly connected client so it can display any active edit locks.

If the socket connects before React's `useEffect` registers listeners (a race condition observed in Safari), `App.jsx` detects `socket.connected === true` and manually emits `requestUsersOnline` to sync state.

### Disconnection

On disconnect, the server decrements the user counter and broadcasts the updated count. All edit locks held by the disconnected socket are released with their expiry timers cleared. `bookUnlocked` is broadcast for each released lock so other clients remove the lock indicators.

### Reconnection

Configured with 5 reconnection attempts at 1-second intervals. Connection state is reflected in the header as a pulsing green "Live" badge or a red "Offline" badge. Lifecycle events (`connect`, `disconnect`, `connect_error`, `reconnect_attempt`, `reconnect_failed`) are logged to the browser console.

---

## Deployment

The application is deployed as a **single service on Railway**. In production, the Express backend serves both the REST API and the frontend static build from one process.

**Live URL:** [https://realtime-book-library.up.railway.app/](https://realtime-book-library.up.railway.app/)

### How it works

- `railway.json` defines the build and start commands
- The **build step** installs frontend dependencies, runs `vite build` to produce `frontend/dist/`, then installs backend production dependencies
- The **start step** runs `node server.js` which serves the API on `/books` and the static frontend on all other routes
- WebSockets (Socket.IO) are supported natively on Railway

### Railway configuration

The repo includes a [`railway.json`](book-realtime-app/railway.json):

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd frontend && npm install && npm run build && cd ../backend && npm install --omit=dev"
  },
  "deploy": {
    "startCommand": "cd backend && node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Deploy steps

1. Push the repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**.
3. Select the repository and set the **Root Directory** to `book-realtime-app`.
4. Set the **Branch** to `deploy/railway`.
5. Add the environment variable:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |

   > `PORT` is set automatically by Railway — do not add it manually.

6. Click **Deploy**. Railway will build and start the service.

### Environment variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | Railway (auto-set) | Server port — assigned by Railway |
| `NODE_ENV` | Railway | Set to `production` to enable static file serving, helmet, compression |
| `CORS_ORIGIN` | Railway (optional) | Comma-separated allowed origins. Not needed for single-service deploy. |

### Production features

The production backend (`server.js`) includes:

- **Helmet** — security headers (CSP, XSS protection, etc.)
- **Compression** — gzip responses
- **Rate limiting** — 100 requests/minute on `/books`
- **Static file serving** — serves `frontend/dist/` in production
- **SPA fallback** — all non-API routes return `index.html` for client-side routing

### Production considerations

- **Database:** The current in-memory store resets on every server restart. For persistence, swap `bookService.js` with a database (PostgreSQL, MongoDB, etc.).
- **CORS:** In single-service mode, CORS is not needed (same-origin). If you split frontend/backend, set `CORS_ORIGIN` to your frontend URL.

### Deployment Results

The application has been successfully deployed to Railway and is accessible at:

**Live URL:** [https://realtime-book-library.up.railway.app/](https://realtime-book-library.up.railway.app/)

Verification in production confirmed that:

- REST API endpoints respond correctly
- WebSocket connections are established successfully
- Real-time updates propagate between multiple browser sessions
- Activity feed and user counter function correctly in production
- The Express server successfully serves the built frontend

This confirms that the application operates correctly in a deployed environment with real-time WebSocket communication.

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| "Offline" badge on first load (Safari) | Socket connects before React listeners register | Already handled — the app re-requests state after listener setup. Hard refresh if it persists. |
| "Could not load books" error banner | Backend is not running or unreachable | Start the backend with `npm run dev` and verify it's on port 5001. |
| Socket connection error in console | Backend URL mismatch or server down | Check both servers are running. On another device, ensure `--host` is used and correct IP. |
| Port 5001 already in use | Another process on the port | `lsof -ti:5001 \| xargs kill` or change the port in `server.js`. |
| Lock indicator stuck on a book | Editor disconnected or lock expired | Locks auto-release after 15 seconds or on disconnect. Wait or refresh. |
| Tailwind styles not applied | Plugin not installed | Run `npm install` in the frontend folder; verify `vite.config.js` includes `tailwindcss()`. |
| Books reset after server restart | In-memory store (no database) | Expected behavior. Add a database for persistence. |

---

## Monitoring and Post-Deployment Checks

After deploying the application, several checks are performed to ensure that the real-time communication system works reliably.

### Runtime Monitoring

The backend logs key Socket.IO lifecycle events:

- client connections
- client disconnections
- reconnection attempts
- connection errors

These logs help detect issues with WebSocket connectivity or unexpected client drops.

Example events monitored:

- `connect`
- `disconnect`
- `connect_error`
- `reconnect_attempt`

### Deployment Platform Logs

The application is deployed on Railway, which provides runtime logs for the Node.js server. These logs allow monitoring of:

- server startup
- WebSocket connections
- API request errors
- unexpected crashes

### Post-Deployment Verification

After deployment, the following checks were performed:

1. Open the application in multiple browser tabs.
2. Add or edit a book in one tab.
3. Confirm that updates appear instantly on other tabs.
4. Verify that the connected users counter updates when tabs are opened or closed.
5. Confirm that WebSocket reconnection restores the live connection after temporary network interruption.

