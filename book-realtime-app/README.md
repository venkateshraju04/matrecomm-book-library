# 📚 Book Manager — Real-time App

A full-stack application demonstrating real-time book management using **Node.js, Express, Socket.IO, and React (Vite)**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  React (Vite)                                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │  App.js  │──▶│AddBook.js│   │BookList  │               │
│  │          │   │(POST)    │   │(PUT)     │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│       ▲                                                     │
│       │  Socket.IO events                                   │
│       │  (bookAdded / bookUpdated)                          │
└───────┼─────────────────────────────────────────────────────┘
        │  WebSocket (ws://localhost:5001)
┌───────┼─────────────────────────────────────────────────────┐
│       ▼                                                     │
│  Node.js + Express + Socket.IO  (port 5000)                 │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  server.js  │──▶│  socket.js   │   │ routes/books.js │  │
│  │ (HTTP+WS)   │   │ (lifecycle)  │   │ (REST + emit)   │  │
│  └─────────────┘   └──────────────┘   └─────────────────┘  │
│                                             │               │
│                    In-memory array (books[])◀┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Flow

```
User adds a book (Tab A)
  │
  ▼
AddBook.js  ──POST /books──▶  routes/books.js
                                    │
                              books.push(newBook)
                                    │
                            io.emit("bookAdded", newBook)
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
        Tab A (App.js)                             Tab B (App.js)
     onBookAdded called                         onBookAdded called
     setBooks([...prev, newBook])               setBooks([...prev, newBook])
     List updates instantly ✓                  List updates instantly ✓
```

The same flow applies when a book is updated (`bookUpdated` event), except the handler uses `Array.map` to replace the matching entry instead of appending.

---

## How WebSockets Work Here

1. The frontend loads and `socket.js` calls `io("http://localhost:5001")`, establishing a persistent WebSocket connection.
2. The backend (`socket.js`) logs the connection with its unique `socket.id`.
3. When a REST mutation (`POST` / `PUT`) happens, the route handler calls `io.emit(eventName, payload)`, which broadcasts the new data to **every** connected client simultaneously.
4. Each React app instance listens for these events in `App.js` and updates its own `books` state, causing an instant re-render — no polling, no page refresh.

---

## Project Structure

```
book-realtime-app/
├── backend/
│   ├── package.json          # npm deps: express, socket.io, cors, nodemon
│   ├── server.js             # HTTP server, Socket.IO init, middleware, routes
│   ├── socket.js             # Connection/disconnection logging
│   └── routes/
│       └── books.js          # GET /books  POST /books  PUT /books/:id
│
└── frontend/
    ├── package.json          # npm deps: react, socket.io-client, axios, vite
    ├── vite.config.js        # JSX-in-.js support
    ├── index.html            # HTML shell
    └── src/
        ├── main.js           # ReactDOM entry point
        ├── App.js            # Root — fetches data, subscribes to socket events
        ├── AddBook.js        # Form to add a book via POST
        ├── BookList.js       # Renders books; inline PUT edit
        └── socket.js         # Singleton Socket.IO client
```

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

> **macOS note:** Port 5000 is reserved by the AirPlay Receiver service on macOS Monterey and later. This project uses port **5001** for the backend to avoid that conflict.

---

## How to Run

### 1 — Install & start the backend

```bash
cd book-realtime-app/backend
npm install
npm run dev          # starts with nodemon on http://localhost:5001
```

### 2 — Install & start the frontend

Open a **second terminal**:

```bash
cd book-realtime-app/frontend
npm install
npm run dev          # starts Vite on http://localhost:5173
```

### 3 — Open the app

Visit **http://localhost:5173** in your browser.

---

## Testing Real-time Updates

1. Open **http://localhost:5173** in **two browser tabs** side by side.
2. In Tab A, fill in a book title and author and click **+ Add Book**.
3. Watch Tab B update instantly — no refresh needed.
4. Click **Edit** on any book in Tab A, change the title, and click **Save**.
5. Tab B reflects the change in real time.

---

## REST API Reference

| Method | Path          | Body                      | Description        |
|--------|---------------|---------------------------|--------------------|
| GET    | `/books`      | —                         | List all books     |
| POST   | `/books`      | `{ title, author }`       | Create a book      |
| PUT    | `/books/:id`  | `{ title, author }`       | Update a book      |

---

## Socket.IO Events

| Event         | Direction         | Payload                  |
|---------------|-------------------|--------------------------|
| `bookAdded`   | Server → Clients  | `{ id, title, author }`  |
| `bookUpdated` | Server → Clients  | `{ id, title, author }`  |

---

## Tech Stack

| Layer    | Technology               |
|----------|--------------------------|
| Backend  | Node.js, Express 4, Socket.IO 4 |
| Frontend | React 18, Vite 5, Axios  |
| Realtime | Socket.IO WebSockets      |
| Storage  | In-memory array (no DB)  |
