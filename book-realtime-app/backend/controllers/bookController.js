/**
 * controllers/bookController.js — HTTP request handlers for the book resource.
 *
 * Each function:
 *   1. Validates the incoming request.
 *   2. Delegates the data operation to bookService.
 *   3. Emits the appropriate Socket.IO event (bookAdded / bookUpdated / activity).
 *   4. Sends the HTTP response.
 *
 * The controller layer keeps routes thin and keeps socket-emit logic
 * co-located with the data mutation that triggers it.
 */

const bookService = require('../services/bookService');

// ---------------------------------------------------------------------------
// Validation helper — used by POST and PUT handlers
// ---------------------------------------------------------------------------
const validateBookBody = (body) => {
  const title  = (body.title  || '').trim();
  const author = (body.author || '').trim();
  if (!title)  return { error: 'title is required'  };
  if (!author) return { error: 'author is required' };
  return { title, author };
};

// ---------------------------------------------------------------------------
// Build an activity payload for the real-time feed
// ---------------------------------------------------------------------------
const makeActivity = (type, title) => ({
  type,
  title,
  timestamp: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// GET /books — Return the full list
// ---------------------------------------------------------------------------
const getBooks = (_req, res) => {
  res.json(bookService.getAllBooks());
};

// ---------------------------------------------------------------------------
// POST /books — Create a book, broadcast bookAdded + activity
// ---------------------------------------------------------------------------
const addBook = (req, res) => {
  const validation = validateBookBody(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const newBook = bookService.createBook(validation);

  // Retrieve the shared io instance attached in server.js
  const io = req.app.get('io');

  // Notify all clients about the new book (list update)
  io.emit('bookAdded', newBook);

  // Notify all clients about the activity (feed update)
  io.emit('activity', makeActivity('BOOK_ADDED', newBook.title));

  console.log(`[controller] Book added    → id:${newBook.id}  "${newBook.title}"`);
  res.status(201).json(newBook);
};

// ---------------------------------------------------------------------------
// PUT /books/:id — Update a book, broadcast bookUpdated + activity
// ---------------------------------------------------------------------------
const updateBook = (req, res) => {
  const id = parseInt(req.params.id, 10);

  const validation = validateBookBody(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const updatedBook = bookService.updateBook(id, validation);
  if (!updatedBook) {
    return res.status(404).json({ error: `Book with id ${id} not found` });
  }

  const io = req.app.get('io');

  // Notify all clients about the updated book (list update)
  io.emit('bookUpdated', updatedBook);

  // Notify all clients about the activity (feed update)
  io.emit('activity', makeActivity('BOOK_UPDATED', updatedBook.title));

  console.log(`[controller] Book updated  → id:${id}  "${updatedBook.title}"`);
  res.json(updatedBook);
};

// ---------------------------------------------------------------------------
// DELETE /books/:id — Delete a book, broadcast bookDeleted + activity
// ---------------------------------------------------------------------------
const deleteBook = (req, res) => {
  const id = parseInt(req.params.id, 10);

  const removed = bookService.deleteBook(id);
  if (!removed) {
    return res.status(404).json({ error: `Book with id ${id} not found` });
  }

  const io = req.app.get('io');
  io.emit('bookDeleted', { id });
  io.emit('activity', makeActivity('BOOK_DELETED', removed.title));

  console.log(`[controller] Book deleted  → id:${id}  "${removed.title}"`);
  res.json({ message: 'Deleted', id });
};

module.exports = { getBooks, addBook, updateBook, deleteBook };
