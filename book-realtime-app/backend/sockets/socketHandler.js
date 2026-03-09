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

// ---------------------------------------------------------------------------
// Soft-lock map: bookId → { socketId, userName, timer }
// Tracks which book is being edited by whom so we can broadcast lock state.
// Locks auto-expire after LOCK_TIMEOUT_MS to prevent stale locks.
// ---------------------------------------------------------------------------
const LOCK_TIMEOUT_MS = 30_000; // 30 seconds
const editLocks = new Map();

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

    // Send current lock state to the newly connected client (exclude timer)
    const currentLocks = {};
    for (const [bookId, lock] of editLocks) {
      currentLocks[bookId] = { socketId: lock.socketId, userName: lock.userName };
    }
    socket.emit('currentLocks', currentLocks);

    // -----------------------------------------------------------------------
    // Soft-lock: a client starts editing a book
    // -----------------------------------------------------------------------
    socket.on('startEditing', ({ bookId, userName }) => {
      if (!bookId) return;
      const name = userName || `User ${socket.id.slice(0, 6)}`;

      // Clear any existing timer for this book
      const existing = editLocks.get(bookId);
      if (existing && existing.timer) clearTimeout(existing.timer);

      // Auto-expire timer: release lock if not saved/cancelled in time
      const timer = setTimeout(() => {
        const lock = editLocks.get(bookId);
        if (lock && lock.socketId === socket.id) {
          editLocks.delete(bookId);
          io.emit('bookUnlocked', { bookId });
          // Notify the editing user that their lock expired
          socket.emit('lockExpired', { bookId });
          console.log(`[lock] Auto-expired lock on book ${bookId} (timeout)`);
        }
      }, LOCK_TIMEOUT_MS);

      editLocks.set(bookId, { socketId: socket.id, userName: name, timer });
      socket.broadcast.emit('bookLocked', { bookId, userName: name });
      console.log(`[lock] ${name} started editing book ${bookId}`);
    });

    // -----------------------------------------------------------------------
    // Soft-lock: a client stops editing (save or cancel)
    // -----------------------------------------------------------------------
    socket.on('stopEditing', ({ bookId }) => {
      if (!bookId) return;
      const lock = editLocks.get(bookId);
      if (lock && lock.socketId === socket.id) {
        if (lock.timer) clearTimeout(lock.timer);
        editLocks.delete(bookId);
        socket.broadcast.emit('bookUnlocked', { bookId });
        console.log(`[lock] Released lock on book ${bookId}`);
      }
    });

    // -----------------------------------------------------------------------
    // Disconnection — decrement, release any locks held, and broadcast
    // -----------------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      connectedUsers--;
      if (connectedUsers < 0) connectedUsers = 0;
      io.emit('usersOnline', connectedUsers);

      // Release all locks held by this socket
      for (const [bookId, lock] of editLocks) {
        if (lock.socketId === socket.id) {
          if (lock.timer) clearTimeout(lock.timer);
          editLocks.delete(bookId);
          io.emit('bookUnlocked', { bookId });
          console.log(`[lock] Auto-released lock on book ${bookId} (disconnect)`);
        }
      }

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
