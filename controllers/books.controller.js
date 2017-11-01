const express = require('express');
const router = express.Router();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const Book = require('mongoose').model('Book');
const ApiError = require('../models/error.model');

/* Get all books. The results should be sorted by date in descending order.
 * Optionally a query parameter limit can be used to limit the number of
 * results.
 */
router.get('/', function (req, res, next) {

    let query = Book.find({
        deleted: false
    }).sort({
        date: 'desc'
    });
    if (req.query.limit)
        query = query.limit(parseInt(req.query.limit));

    query.exec((err, books) => {
        if (err) next(err);
        res.status(200).json(books);
    });
});

// Delete book
router.delete('/:id', function (req, res, next) {

    Book.findByIdAndUpdate(req.params.id, {
        deleted: true
    }, {
        new: true
    }, (err, book) => {
        if (err) return next(err);
        res.status(200).json(book);
        winston.info(`${book.title} deleted by ${req.user.username}.`);
    });
});

module.exports = router;
