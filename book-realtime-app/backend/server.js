/**
 * server.js — Entry point for the Express + Socket.IO backend.
 *
 * Modular structure
 * ─────────────────
 *   services/bookService.js      → in-memory data store + CRUD helpers
 *   controllers/bookController.js→ HTTP handlers; emits bookAdded/bookUpdated/activity
 *   routes/bookRoutes.js         → maps HTTP verbs to controller functions
 *   sockets/socketHandler.js     → tracks usersOnline; emits usersOnline event
 *
 * server.js only:
 *   1. Creates the Express app + HTTP server.
 *   2. Attaches Socket.IO with CORS config.
 *   3. Registers middleware and routes.
 *   4. Shares the io instance via app.set() so controllers can emit events.
 *   5. Delegates socket lifecycle to socketHandler.
 */

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const { Server } = require('socket.io');

const bookRoutes          = require('./routes/bookRoutes');
const { initSocketHandler } = require('./sockets/socketHandler');

// ---------------------------------------------------------------------------
// App & HTTP server
// ---------------------------------------------------------------------------
const app    = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Socket.IO — attached to the same HTTP server so WS upgrade works on /
// CORS is set to the Vite dev-server origin; update for production.
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT'],
  },
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Share io so controllers (called during request handling) can emit events
app.set('io', io);

// ---------------------------------------------------------------------------
// REST routes
// ---------------------------------------------------------------------------
app.use('/books', bookRoutes);

// Health-check
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Book API running' }));

// ---------------------------------------------------------------------------
// Socket.IO lifecycle (connect / disconnect / usersOnline counter)
// ---------------------------------------------------------------------------
initSocketHandler(io);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend listening at http://localhost:${PORT}`);
  console.log('   Waiting for client connections…\n');
});
