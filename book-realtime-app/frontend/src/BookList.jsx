/**
 * src/BookList.jsx — Linear/GitHub-style book list with inline editing.
 * All real-time updates come through socket events handled by App.jsx.
 */
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/books';

function BookList({ books }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ title: '', author: '' });
  const [editError, setEditError] = useState('');
  const [savingId, setSavingId]   = useState(null);

  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({ title: book.title, author: book.author });
    setEditError('');
  };

  const cancelEdit = () => {
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
      cancelEdit();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update book.';
      console.error('[BookList] PUT error:', err.message);
      setEditError(msg);
    } finally {
      setSavingId(null);
    }
  };

  /* ── Empty state ─────────────────────────────────────────────────── */
  if (books.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
          📖
        </div>
        <p className="text-sm font-medium text-slate-500">No books yet</p>
        <p className="mt-1 text-xs text-slate-400">Add your first book above to get started.</p>
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
            className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
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
                {/* Index badge */}
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-400">
                  {book.id}
                </span>

                {/* Book info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{book.title}</p>
                  <p className="truncate text-xs text-slate-500">{book.author}</p>
                </div>

                {/* Edit button — visible on hover (always visible on touch) */}
                <button
                  onClick={() => startEdit(book)}
                  className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 opacity-0 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 group-hover:opacity-100 focus:opacity-100"
                >
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BookList;
