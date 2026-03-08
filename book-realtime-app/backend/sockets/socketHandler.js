/**
 * sockets/socketHandler.js — All Socket.IO event logic lives here.
 *
 * Responsibilities:
 *   • Track how many clients are currently connected (usersOnline counter).
 *   • Emit "usersOnline" to ALL clients whenever someone connects or disconnects
 *     so every tab shows an accurate live count without polling.
 *   • Log connection / disconnection / error events for debugging.
 *
 * Note: Business-level events (bookAdded, bookUpdated, activity) are emitted
 * from bookController.js so the emit logic stays co-located with the mutation.
 * Only infrastructure-level socket events belong in this file.
 */

// ---------------------------------------------------------------------------
// In-memory counter of currently connected sockets
// ---------------------------------------------------------------------------
let connectedUsers = 0;

/**
 * initSocketHandler — Attach connection lifecycle handlers to the io server.
 * Called once from server.js after the io instance is created.
 *
 * @param {import('socket.io').Server} io
 */
const initSocketHandler = (io) => {
  io.on('connection', (socket) => {
    // Increment counter and broadcast the new count to ALL connected clients
    connectedUsers++;
    io.emit('usersOnline', connectedUsers);
    console.log(`[socket] Connected    → id: ${socket.id}  total: ${connectedUsers}`);

    // -----------------------------------------------------------------------
    // Disconnection — decrement and broadcast the updated count
    // -----------------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      connectedUsers--;
      // Ensure count never goes negative due to edge cases
      if (connectedUsers < 0) connectedUsers = 0;
      io.emit('usersOnline', connectedUsers);
      console.log(`[socket] Disconnected ← id: ${socket.id}  reason: ${reason}  total: ${connectedUsers}`);
    });

    // -----------------------------------------------------------------------
    // Socket-level error logging
    // -----------------------------------------------------------------------
    socket.on('error', (err) => {
      console.error(`[socket] Error on ${socket.id}:`, err.message);
    });
  });
};

module.exports = { initSocketHandler };
