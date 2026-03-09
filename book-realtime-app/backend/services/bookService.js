/**
 * services/bookService.js — Pure data-access layer for books.
 *
 * Owns the in-memory store and exposes simple CRUD functions.
 * Contains zero knowledge of HTTP or Socket.IO — keeping it
 * easy to swap for a real database later.
 */

// ---------------------------------------------------------------------------
// In-memory store — pre-seeded with sample books
// ---------------------------------------------------------------------------
let books  = [
  { id: 1, title: 'The Great Gatsby',      author: 'F. Scott Fitzgerald' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee'          },
  { id: 3, title: '1984',                  author: 'George Orwell'       },
];
let nextId = books.length + 1;

/** Return a shallow copy of the full list (prevents external mutation). */
const getAllBooks = () => [...books];

/** Find a single book by id, or null if not found. */
const getBookById = (id) => books.find((b) => b.id === id) || null;

/**
 * Create and persist a new book.
 * @param {{ title: string, author: string }} data
 * @returns {object} The newly created book.
 */
const createBook = ({ title, author }) => {
  const book = { id: nextId++, title, author };
  books.push(book);
  return book;
};

/**
 * Update an existing book by id.
 * @param {number} id
 * @param {{ title: string, author: string }} data
 * @returns {object|null} The updated book, or null if not found.
 */
const updateBook = (id, { title, author }) => {
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;
  books[index] = { id, title, author };
  return books[index];
};

/**
 * Delete a book by id.
 * @param {number} id
 * @returns {object|null} The deleted book, or null if not found.
 */
const deleteBook = (id) => {
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return null;
  const [removed] = books.splice(index, 1);
  return removed;
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };
