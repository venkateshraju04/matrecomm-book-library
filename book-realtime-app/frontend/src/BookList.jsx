/**
 * src/BookList.js — Displays all books and provides inline edit functionality.
 *
 * Flow for editing a book:
 *   1. User clicks "Edit" on a row → form fields appear inline.
 *   2. User edits title/author and clicks "Save".
 *   3. A PUT request is sent to the REST API.
 *   4. The backend updates the book in memory, then emits "bookUpdated".
 *   5. App.js receives "bookUpdated" and updates the React state.
 *
 * As with AddBook, the component does NOT update state optimistically after
 * the PUT — that guarantee comes from the socket listener in App.js so
 * all connected tabs (including the editor's own tab) stay in sync.
 */
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/books';

function BookList({ books }) {
  // Track which book row is currently being edited
  const [editingId, setEditingId]   = useState(null);
  const [editForm, setEditForm]       = useState({ title: '', author: '' });
  const [editError, setEditError]     = useState('');
  const [savingId, setSavingId]       = useState(null);

  // Enter edit mode for a specific book
  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({ title: book.title, author: book.author });
    setEditError('');
  };

  // Cancel edit without saving
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', author: '' });
    setEditError('');
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit updated book to the API
  const handleSave = async (id) => {
    setEditError('');
    if (!editForm.title.trim() || !editForm.author.trim()) {
      setEditError('Title and author cannot be empty.');
      return;
    }

    setSavingId(id);
    try {
      await axios.put(`${API_URL}/${id}`, editForm);
      // UI updates via Socket.IO "bookUpdated" event received in App.js
      cancelEdit();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update book.';
      console.error('[BookList] PUT error:', err.message);
      setEditError(msg);
    } finally {
      setSavingId(null);
    }
  };

  if (books.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>No books yet — add one above!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={styles.heading}>Books ({books.length})</h2>
      <ul style={styles.list}>
        {books.map((book) => (
          <li key={book.id} style={styles.item}>
            {editingId === book.id ? (
              /* ---- Edit mode ---- */
              <div style={styles.editRow}>
                <input
                  style={styles.input}
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  placeholder="Title"
                  disabled={savingId === book.id}
                  autoFocus
                />
                <input
                  style={styles.input}
                  name="author"
                  value={editForm.author}
                  onChange={handleEditChange}
                  placeholder="Author"
                  disabled={savingId === book.id}
                />
                <div style={styles.editActions}>
                  <button
                    style={styles.saveBtn}
                    onClick={() => handleSave(book.id)}
                    disabled={savingId === book.id}
                  >
                    {savingId === book.id ? 'Saving…' : 'Save'}
                  </button>
                  <button style={styles.cancelBtn} onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
                {editError && <p style={styles.editError}>{editError}</p>}
              </div>
            ) : (
              /* ---- Read mode ---- */
              <div style={styles.readRow}>
                <div style={styles.bookMeta}>
                  <span style={styles.bookId}>#{book.id}</span>
                  <span style={styles.bookTitle}>{book.title}</span>
                  <span style={styles.bookAuthor}>— {book.author}</span>
                </div>
                <button style={styles.editBtn} onClick={() => startEdit(book)}>
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  heading: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '12px',
  },
  emptyState: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    background: '#fff',
    borderRadius: '10px',
    border: '1px dashed #ccc',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  item: {
    background: '#fff',
    border: '1px solid #dce3ee',
    borderRadius: '8px',
    padding: '14px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  readRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  bookMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    flexWrap: 'wrap',
    flex: 1,
  },
  bookId: {
    color: '#aaa',
    fontSize: '12px',
    minWidth: '28px',
  },
  bookTitle: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '15px',
  },
  bookAuthor: {
    color: '#666',
    fontSize: '14px',
  },
  editBtn: {
    padding: '5px 14px',
    background: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    flexShrink: 0,
  },
  editRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: '1 1 140px',
    padding: '7px 10px',
    borderRadius: '5px',
    border: '1px solid #c5cfe0',
    fontSize: '14px',
    outline: 'none',
  },
  editActions: {
    display: 'flex',
    gap: '6px',
  },
  saveBtn: {
    padding: '7px 14px',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  cancelBtn: {
    padding: '7px 14px',
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  editError: {
    width: '100%',
    color: '#c0392b',
    fontSize: '13px',
    marginTop: '4px',
  },
};

export default BookList;
