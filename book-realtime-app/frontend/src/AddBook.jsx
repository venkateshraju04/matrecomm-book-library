/**
 * src/AddBook.jsx — Modern card form for adding a new book.
 * POST -> server emits bookAdded -> App.jsx updates state via socket.
 */
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || ''}/books`;

function AddBook() {
  const [form, setForm]       = useState({ title: '', author: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.author.trim()) {
      setError('Both title and author are required.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(API_URL, form);
      setForm({ title: '', author: '' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add book. Is the server running?';
      console.error('[AddBook] POST error:', err.message);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Section header */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-800">Add a New Book</h2>
      </div>

      {/* Form row: stacks on mobile, inline on sm+ */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="add-title" className="mb-1 block text-xs font-medium text-slate-500">
            Title
          </label>
          <input
            id="add-title"
            name="title"
            type="text"
            placeholder="e.g. Atomic Habits"
            value={form.title}
            onChange={handleChange}
            disabled={loading}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="add-author" className="mb-1 block text-xs font-medium text-slate-500">
            Author
          </label>
          <input
            id="add-author"
            name="author"
            type="text"
            placeholder="e.g. James Clear"
            value={form.author}
            onChange={handleChange}
            disabled={loading}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Adding…
            </>
          ) : (
            '+ Add Book'
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </section>
  );
}

export default AddBook;
