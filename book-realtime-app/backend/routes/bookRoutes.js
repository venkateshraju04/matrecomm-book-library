/**
 * routes/bookRoutes.js — Express router for the /books resource.
 *
 * This file is intentionally thin: it maps HTTP verbs + paths to the
 * corresponding controller handlers and nothing else.
 */

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/bookController');

// GET  /books       → list all books
router.get('/',     controller.getBooks);

// POST /books       → create a book  → emits "bookAdded" + "activity"
router.post('/',    controller.addBook);

// PUT  /books/:id   → update a book  → emits "bookUpdated" + "activity"
router.put('/:id',  controller.updateBook);

module.exports = router;
