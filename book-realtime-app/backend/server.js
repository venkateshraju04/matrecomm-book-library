/**
 * server.js — Entry point for the Express + Socket.IO backend.
 *
 * Responsibilities:
 *   - Create an HTTP server and attach Socket.IO to it.
 *   - Register middleware (CORS, JSON body parsing).
 *   - Mount the /books REST router.
 *   - Make the `io` instance available to route handlers via app.set().
 *   - Initialize Socket.IO connection/disconnection logging.
 */

const express = require('express');
const http    = require('http');
const cors    = require('cors');
const { Server } = require('socket.io');

const bookRoutes  = require('./routes/books');
const { initSocket } = require('./socket');

// ---------------------------------------------------------------------------
// App & HTTP server
// ---------------------------------------------------------------------------
const app    = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Socket.IO — attach to the HTTP server with CORS for the Vite dev server
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST', 'PUT'],
  },
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Share the io instance with route handlers (used in routes/books.js)
app.set('io', io);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/books', bookRoutes);

// Simple health-check
app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Book API running' }));

// ---------------------------------------------------------------------------
// Socket.IO connection lifecycle
// ---------------------------------------------------------------------------
initSocket(io);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend listening at http://localhost:${PORT}`);
  console.log('   Waiting for client connections…\n');
});
