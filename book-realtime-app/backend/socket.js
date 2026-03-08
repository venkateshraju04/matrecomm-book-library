/**
 * socket.js — Socket.IO connection/disconnection lifecycle.
 *
 * This module is intentionally thin.  Business-level events (bookAdded,
 * bookUpdated) are emitted directly from the route handlers in
 * routes/books.js so the event logic stays close to the data mutation.
 *
 * If you need to add room management, authentication middleware, or
 * additional custom events, this is the right place.
 */

/**
 * initSocket — Wire up global Socket.IO connection/disconnection handlers.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[socket] Client connected    → id: ${socket.id}`);

    // Log when a client disconnects (tab closed, network drop, etc.)
    socket.on('disconnect', (reason) => {
      console.log(`[socket] Client disconnected ← id: ${socket.id}  reason: ${reason}`);
    });

    // Log socket-level errors for easier debugging
    socket.on('error', (err) => {
      console.error(`[socket] Error on ${socket.id}:`, err.message);
    });
  });
};

module.exports = { initSocket };
