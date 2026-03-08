/**
 * src/AddBook.js — Form component for creating a new book.
 *
 * Flow:
 *   1. User fills in title + author and submits.
 *   2. A POST request is sent to the REST API.
 *   3. The backend persists the book, then emits "bookAdded" via Socket.IO.
 *   4. App.js receives "bookAdded" and updates the books list in React state.
 *
 * Note: This component does NOT update state directly after a successful
 * POST — that would cause a duplicate entry.  All state updates happen
 * through the socket listener registered in App.js.
 */
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/books';

function AddBook() {
  const [form, setForm]   = useState({ title: '', author: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.title.trim() || !form.author.trim()) {
      setError('Both title and author are required.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(API_URL, form);
      // On success: clear form — UI list updates via Socket.IO event in App.js
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
    <div style={styles.card}>
      <h2 style={styles.heading}>Add a New Book</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          name="title"
          placeholder="Book title"
          value={form.title}
          onChange={handleChange}
          disabled={loading}
          autoComplete="off"
        />
        <input
          style={styles.input}
          type="text"
          name="author"
          placeholder="Author name"
          value={form.author}
          onChange={handleChange}
          disabled={loading}
          autoComplete="off"
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Adding…' : '+ Add Book'}
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    border: '1px solid #dce3ee',
    borderRadius: '10px',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  heading: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '14px',
  },
  form: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 160px',
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid #c5cfe0',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '9px 20px',
    background: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  error: {
    marginTop: '10px',
    color: '#c0392b',
    fontSize: '13px',
  },
};

export default AddBook;
