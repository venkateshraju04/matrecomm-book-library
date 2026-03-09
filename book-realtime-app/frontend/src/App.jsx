/**
 * src/App.jsx — Root dashboard layout.
 *
 * Two-column grid on desktop (left: books, right: sidebar).
 * Stacks vertically on mobile. All real-time logic unchanged.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';
import BookList from './BookList';
import AddBook from './AddBook';
import ActivityFeed from './ActivityFeed';

const API_URL = `http://${window.location.hostname}:5001/books`;

function App() {
  const [books, setBooks]             = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [usersOnline, setUsersOnline] = useState(0);
  const [fetchError, setFetchError]   = useState('');
  const [loading, setLoading]         = useState(true);

  /* Load initial books */
  useEffect(() => {
    axios
      .get(API_URL)
      .then((res) => setBooks(res.data))
      .catch((err) => {
        console.error('[app] Failed to fetch books:', err.message);
        setFetchError('Could not load books. Is the backend running on port 5001?');
      })
      .finally(() => setLoading(false));
  }, []);

  /* Real-time Socket.IO listeners */
  useEffect(() => {
    const onConnect     = ()  => setIsConnected(true);
    const onDisconnect  = ()  => setIsConnected(false);
    const onBookAdded   = (b) => { console.log('[socket] bookAdded:', b);   setBooks((p) => [...p, b]); };
    const onBookUpdated = (b) => { console.log('[socket] bookUpdated:', b); setBooks((p) => p.map((x) => (x.id === b.id ? b : x))); };
    const onUsersOnline = (n) => { console.log('[socket] usersOnline:', n); setUsersOnline(n); };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* ── Sticky top bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex items-center justify-between px-6 py-3 lg:px-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg text-white shadow-sm">
              📚
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Book Manager
            </h1>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-3">
            {/* Users count (hidden on xs) */}
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {usersOnline} online
            </span>

            {/* Live / Offline pill */}
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="mx-auto px-6 py-8 lg:px-10">
        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {/* Two-column grid — stacks on mobile */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left column: form + book list */}
          <div className="flex flex-col gap-8">
            <AddBook />
            <BookList books={books} loading={loading} />
          </div>

          {/* Right sidebar: activity */}
          <aside className="flex flex-col gap-8">
            <ActivityFeed />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
