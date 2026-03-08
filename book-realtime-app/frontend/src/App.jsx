/**
 * src/App.jsx — Root component.
 *
 * Responsibilities:
 *   1. Fetch the initial book list from the REST API on first render.
 *   2. Subscribe to Socket.IO events:
 *        - bookAdded    → append new book to state
 *        - bookUpdated  → replace existing book in state
 *        - usersOnline  → update the live user counter
 *   3. Render ActivityFeed (real-time event log) and connected-users badge.
 *   4. Pass books array down to BookList; AddBook triggers mutations via API.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';
import BookList from './BookList';
import AddBook from './AddBook';
import ActivityFeed from './ActivityFeed';

const API_URL = 'http://localhost:5001/books';

function App() {
  const [books, setBooks]           = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [usersOnline, setUsersOnline] = useState(0);
  const [fetchError, setFetchError]   = useState('');

  // -------------------------------------------------------------------------
  // 1. Load initial book list once on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setBooks(res.data))
      .catch((err) => {
        console.error('[app] Failed to fetch books:', err.message);
        setFetchError('Could not load books. Is the backend running on port 5001?');
      });
  }, []);

  // -------------------------------------------------------------------------
  // 2. Real-time Socket.IO event listeners
  //    All listeners are registered once and cleaned up on unmount to
  //    prevent duplicate subscriptions caused by React StrictMode double-mount.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Connection status badge
    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // A new book arrived from ANY connected client → append to the list
    const onBookAdded = (newBook) => {
      console.log('[socket] bookAdded:', newBook);
      setBooks((prev) => [...prev, newBook]);
    };

    // A book was updated by ANY client → replace the matching entry
    const onBookUpdated = (updatedBook) => {
      console.log('[socket] bookUpdated:', updatedBook);
      setBooks((prev) =>
        prev.map((book) => (book.id === updatedBook.id ? updatedBook : book))
      );
    };

    // Live user count broadcast by socketHandler on every connect/disconnect
    const onUsersOnline = (count) => {
      console.log('[socket] usersOnline:', count);
      setUsersOnline(count);
    };

    socket.on('connect',     onConnect);
    socket.on('disconnect',  onDisconnect);
    socket.on('bookAdded',   onBookAdded);
    socket.on('bookUpdated', onBookUpdated);
    socket.on('usersOnline', onUsersOnline);

    return () => {
      socket.off('connect',     onConnect);
      socket.off('disconnect',  onDisconnect);
      socket.off('bookAdded',   onBookAdded);
      socket.off('bookUpdated', onBookUpdated);
      socket.off('usersOnline', onUsersOnline);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header style={styles.header}>
          <h1 style={styles.title}>📚 Book Manager</h1>
          <div style={styles.badges}>
            {/* Connected-users counter — updated in real time via usersOnline */}
            <span style={styles.badgeUsers}>
              👥 {usersOnline} {usersOnline === 1 ? 'user' : 'users'} online
            </span>
            {/* WebSocket connection status */}
            <span style={isConnected ? styles.badgeOnline : styles.badgeOffline}>
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </span>
          </div>
        </header>

        {fetchError && <p style={styles.fetchError}>{fetchError}</p>}

        {/* ── Add-book form ─────────────────────────────────────────────── */}
        <AddBook />

        {/* ── Book list ─────────────────────────────────────────────────── */}
        <BookList books={books} setBooks={setBooks} />

        {/* ── Real-time activity feed ───────────────────────────────────── */}
        <ActivityFeed />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f4fa',
    padding: '24px 16px',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
  },
  badges: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badgeUsers: {
    padding: '4px 12px',
    borderRadius: '999px',
    background: '#eaf0fb',
    color: '#2980b9',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  badgeOnline: {
    padding: '4px 12px',
    borderRadius: '999px',
    background: '#d5f5e3',
    color: '#1e8449',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  badgeOffline: {
    padding: '4px 12px',
    borderRadius: '999px',
    background: '#fde8e8',
    color: '#c0392b',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  fetchError: {
    color: '#c0392b',
    background: '#fde8e8',
    padding: '10px 14px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
};

export default App;
