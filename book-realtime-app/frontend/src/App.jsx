/**
 * src/App.js — Root component.
 *
 * Responsibilities:
 *   1. Fetch the initial book list from the REST API on first render.
 *   2. Subscribe to Socket.IO events (bookAdded, bookUpdated) and update
 *      React state — no page refresh needed.
 *   3. Track connection status and surface it in the UI.
 *   4. Pass the books array (and its setter) down to child components.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';
import BookList from './BookList';
import AddBook from './AddBook';

const API_URL = 'http://localhost:5001/books';

function App() {
  const [books, setBooks]           = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fetchError, setFetchError]   = useState('');

  // -------------------------------------------------------------------------
  // 1. Load initial data once on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setBooks(res.data))
      .catch((err) => {
        console.error('[app] Failed to fetch books:', err.message);
        setFetchError('Could not load books. Is the backend running on port 5000?');
      });
  }, []);

  // -------------------------------------------------------------------------
  // 2. Real-time Socket.IO event listeners
  //    Handlers are registered once and cleaned up when the component
  //    unmounts, preventing duplicate event subscriptions.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Track connection badge
    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    // A new book was added by ANY client → append to the local list
    const onBookAdded = (newBook) => {
      console.log('[socket] bookAdded received:', newBook);
      setBooks((prev) => [...prev, newBook]);
    };

    // An existing book was updated by ANY client → replace in the local list
    const onBookUpdated = (updatedBook) => {
      console.log('[socket] bookUpdated received:', updatedBook);
      setBooks((prev) =>
        prev.map((book) => (book.id === updatedBook.id ? updatedBook : book))
      );
    };

    socket.on('connect',     onConnect);
    socket.on('disconnect',  onDisconnect);
    socket.on('bookAdded',   onBookAdded);
    socket.on('bookUpdated', onBookUpdated);

    // Cleanup: remove listeners when App unmounts
    return () => {
      socket.off('connect',     onConnect);
      socket.off('disconnect',  onDisconnect);
      socket.off('bookAdded',   onBookAdded);
      socket.off('bookUpdated', onBookUpdated);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>📚 Book Manager</h1>
          <span style={isConnected ? styles.badgeOnline : styles.badgeOffline}>
            {isConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
        </header>

        {fetchError && <p style={styles.fetchError}>{fetchError}</p>}

        {/* AddBook form — does not receive setBooks; state is updated via socket */}
        <AddBook />

        {/* BookList — receives books (read) and setBooks (for optimistic updates) */}
        <BookList books={books} setBooks={setBooks} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles — keeps the project self-contained (no CSS files needed)
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
  },
  title: {
    fontSize: '28px',
    color: '#2c3e50',
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
