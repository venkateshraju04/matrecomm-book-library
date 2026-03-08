/**
 * src/socket.js — Singleton Socket.IO client instance.
 *
 * By creating the connection in its own module and exporting the socket
 * object, every component that imports it shares the SAME connection.
 * This prevents duplicate connections caused by component re-renders.
 *
 * Configuration:
 *   - reconnectionAttempts: retry up to 5 times before giving up
 *   - reconnectionDelay:    wait 1 s between retries
 */
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// --- Lifecycle logging (visible in browser DevTools console) -------------

socket.on('connect', () => {
  console.log('[socket] Connected to server  id:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[socket] Disconnected — reason:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[socket] Connection error:', err.message);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`[socket] Reconnect attempt ${attempt}…`);
});

socket.on('reconnect_failed', () => {
  console.error('[socket] All reconnection attempts failed.');
});

export default socket;
