/**
 * server.js — Entry point for the Express + Socket.IO backend.
 */

require('dotenv').config();

const express     = require('express');
const http        = require('http');
const path        = require('path');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const { Server }  = require('socket.io');

const bookRoutes            = require('./routes/bookRoutes');
const { initSocketHandler } = require('./sockets/socketHandler');

const isProduction = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// App & HTTP server
// ---------------------------------------------------------------------------
const app    = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Allowed origins for CORS & Socket.IO
// ---------------------------------------------------------------------------
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : (isProduction ? false : ['http://localhost:5173', 'http://127.0.0.1:5173']);

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

// Security headers — relaxed CSP for WebSocket connections
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            connectSrc: ["'self'", 'ws:', 'wss:'],
            imgSrc: ["'self'", 'data:'],
          },
        }
      : false,
  }),
);

app.use(compression());

app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

// Rate-limit API endpoints
app.use(
  '/books',
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json());

// Share io so controllers can emit events
app.set('io', io);

// ---------------------------------------------------------------------------
// REST routes
// ---------------------------------------------------------------------------
app.use('/books', bookRoutes);

// ---------------------------------------------------------------------------
// Serve frontend in production
// ---------------------------------------------------------------------------
if (isProduction) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  // SPA fallback — let React Router handle client-side routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.json({ status: 'ok', message: 'Book API running' }));
}

// ---------------------------------------------------------------------------
// Socket.IO lifecycle
// ---------------------------------------------------------------------------
initSocketHandler(io);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend listening on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  if (!isProduction) console.log(`   http://localhost:${PORT}`);
});
