/**
 * src/BookList.jsx — Linear/GitHub-style book list with inline editing.
 * All real-time updates come through socket events handled by App.jsx.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from './socket';

const API_URL = `http://${window.location.hostname}:5001/books`;

function BookList({ books, loading }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ title: '', author: '' });
  const [editError, setEditError] = useState('');
  const [savingId, setSavingId]   = useState(null);
  // Soft-lock state: { [bookId]: "User X" } — books locked by OTHER users
  const [locks, setLocks]         = useState({});

  /* ── Listen for lock/unlock events from other users ──────────────── */
  useEffect(() => {
    const onCurrentLocks = (lockMap) => {
      // lockMap: { bookId: { socketId, userName } }
      const mapped = {};
      for (const [bookId, lock] of Object.entries(lockMap)) {
        mapped[bookId] = lock.userName;
      }
      setLocks(mapped);
    };
    const onBookLocked = ({ bookId, userName }) => {
      setLocks((prev) => ({ ...prev, [bookId]: userName }));
    };
    const onBookUnlocked = ({ bookId }) => {
      setLocks((prev) => {
        const next = { ...prev };
        delete next[bookId];
        return next;
      });
    };

    // Server tells us our own lock expired
    const onLockExpired = ({ bookId }) => {
      setEditingId((cur) => (cur === Number(bookId) || cur === bookId ? null : cur));
      setEditForm({ title: '', author: '' });
      setEditError('');
    };

    socket.on('currentLocks', onCurrentLocks);
    socket.on('bookLocked', onBookLocked);
    socket.on('bookUnlocked', onBookUnlocked);
    socket.on('lockExpired', onLockExpired);

    return () => {
      socket.off('currentLocks', onCurrentLocks);
      socket.off('bookLocked', onBookLocked);
      socket.off('bookUnlocked', onBookUnlocked);
      socket.off('lockExpired', onLockExpired);
    };
  }, []);

  const startEdit = (book) => {
    // Release lock on the previously edited book (if any) before locking the new one
    if (editingId != null && editingId !== book.id) {
      socket.emit('stopEditing', { bookId: editingId });
    }
    setEditingId(book.id);
    setEditForm({ title: book.title, author: book.author });
    setEditError('');
    socket.emit('startEditing', { bookId: book.id });
  };

  const cancelEdit = () => {
    if (editingId != null) {
      socket.emit('stopEditing', { bookId: editingId });
    }
    setEditingId(null);
    setEditForm({ title: '', author: '' });
    setEditError('');
  };

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (id) => {
    setEditError('');
    if (!editForm.title.trim() || !editForm.author.trim()) {
      setEditError('Title and author cannot be empty.');
      return;
    }
    setSavingId(id);
    try {
      await axios.put(`${API_URL}/${id}`, editForm);
      socket.emit('stopEditing', { bookId: id });
      setEditingId(null);
      setEditForm({ title: '', author: '' });
      setEditError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update book.';
      console.error('[BookList] PUT error:', err.message);
      setEditError(msg);
    } finally {
      setSavingId(null);
    }
  };

  /* ── Skeleton loading ────────────────────────────────────────────── */
  if (loading) {
    return (
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Books</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4">
              <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/5 animate-pulse rounded-md bg-slate-200" />
                <div className="h-3 w-2/5 animate-pulse rounded-md bg-slate-100" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  /* ── Empty state ─────────────────────────────────────────────────── */
  if (books.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl shadow-sm">
          📚
        </div>
        <p className="text-base font-semibold text-slate-700">No books yet</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">Add your first book to get started.</p>
      </section>
    );
  }

  /* ── List ─────────────────────────────────────────────────────────── */
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Books</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
          {books.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {books.map((book) => (
          <li
            key={book.id}
            className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:bg-slate-50/50"
          >
            {editingId === book.id ? (
              /* ── Edit mode ──────────────────────────────────────── */
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    placeholder="Title"
                    disabled={savingId === book.id}
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  />
                  <input
                    name="author"
                    value={editForm.author}
                    onChange={handleEditChange}
                    placeholder="Author"
                    disabled={savingId === book.id}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(book.id)}
                    disabled={savingId === book.id}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60"
                  >
                    {savingId === book.id ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 active:scale-[0.97]"
                  >
                    Cancel
                  </button>
                  {editError && (
                    <span className="text-xs text-red-500">{editError}</span>
                  )}
                </div>
              </div>
            ) : (
              /* ── Read mode ──────────────────────────────────────── */
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=6366f1&color=fff&size=40&rounded=true&bold=true`}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded-full shadow-sm"
                />

                {/* Book info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{book.title}</p>
                  <p className="truncate text-xs text-slate-500">{book.author}</p>
                </div>

                {/* Edit button / Lock indicator */}
                {locks[book.id] ? (
                  /* ── Locked by another user ── */
                  <div className="relative flex-shrink-0 group/lock">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-400 cursor-not-allowed"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      Editing
                    </button>
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[200px] rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/lock:opacity-100">
                      A user is currently editing this
                      <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-slate-800" />
                    </div>
                  </div>
                ) : (
                  /* ── Normal edit button — visible on hover ── */
                  <button
                    onClick={() => startEdit(book)}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 opacity-0 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md hover:-translate-y-0.5 group-hover:opacity-100 focus:opacity-100"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BookList;
