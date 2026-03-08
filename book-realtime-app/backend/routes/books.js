/**
 * routes/books.js — REST API for the book resource.
 *
 * In-memory store (no database required):
 *   books  — array of { id, title, author }
 *   nextId — auto-incrementing ID counter
 *
 * After every mutating operation (POST / PUT) the route emits a real-time
 * Socket.IO event so all connected browser tabs update instantly.
 *
 * Endpoints:
 *   GET  /books       → list all books
 *   POST /books       → create a book  → emits "bookAdded"
 *   PUT  /books/:id   → update a book  → emits "bookUpdated"
 */

const express = require('express');
const router  = express.Router();

// ---------------------------------------------------------------------------
// In-memory data store — pre-seeded with two sample books
// ---------------------------------------------------------------------------
let books  = [
  { id: 1, title: 'The Great Gatsby',        author: 'F. Scott Fitzgerald' },
  { id: 2, title: 'To Kill a Mockingbird',   author: 'Harper Lee'          },
  { id: 3, title: '1984',                    author: 'George Orwell'       },
];
let nextId = books.length + 1;

// ---------------------------------------------------------------------------
// Input validation helper
// ---------------------------------------------------------------------------
const validateBookBody = (body) => {
  const title  = (body.title  || '').trim();
  const author = (body.author || '').trim();
  if (!title)  return { error: 'title is required'  };
  if (!author) return { error: 'author is required' };
  return { title, author };
};

// ---------------------------------------------------------------------------
// GET /books — Return the full list
// ---------------------------------------------------------------------------
router.get('/', (_req, res) => {
  res.json(books);
});

// ---------------------------------------------------------------------------
// POST /books — Add a new book and broadcast to all clients
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  const validation = validateBookBody(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const newBook = { id: nextId++, title: validation.title, author: validation.author };
  books.push(newBook);

  // Emit real-time event → all connected clients receive the new book object
  const io = req.app.get('io');
  io.emit('bookAdded', newBook);
  console.log(`[api] Book added    → id:${newBook.id}  "${newBook.title}"`);

  res.status(201).json(newBook);
});

// ---------------------------------------------------------------------------
// PUT /books/:id — Update an existing book and broadcast to all clients
// ---------------------------------------------------------------------------
router.put('/:id', (req, res) => {
  const id    = parseInt(req.params.id, 10);
  const index = books.findIndex((b) => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Book with id ${id} not found` });
  }

  const validation = validateBookBody(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  books[index] = { id, title: validation.title, author: validation.author };

  // Emit real-time event → all connected clients update the matching entry
  const io = req.app.get('io');
  io.emit('bookUpdated', books[index]);
  console.log(`[api] Book updated  → id:${id}  "${books[index].title}"`);

  res.json(books[index]);
});

module.exports = router;
