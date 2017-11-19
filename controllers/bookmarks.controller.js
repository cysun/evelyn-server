const express = require('express');
const router = express.Router();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const mongoose = require('mongoose');
const Bookmark = mongoose.model('Bookmark');
const Sequence = mongoose.model('Sequence');
const sequenceId = process.env.DB_SEQUENCE;
const ApiError = require('../models/error.model');

// Get bookmark by id
router.get('/:id', function (req, res, next) {

  Bookmark.findById(req.params.id, (err, bookmark) => {
    if (err) return next(err);
    if (!bookmark) {
      res.status(404).json(ApiError.error404());
      return;
    }
    if (bookmark.user != req.user._id) {
      res.status(403).json(ApiError.error403());
      return;
    }
    res.status(200).json(bookmark);
  });
});

/* Get bookmark by bookId. The current design does not support setting multiple
 * bookmarks on the same book even though it is allowed at the database level.
 * If multiple bookmarks are set, one of them will be returned, but there's no
 * guaranttee that it's the latest one.
 */
router.get('/book/:bookId', function (req, res, next) {

  Bookmark.findOne({
    book: req.params.bookId,
    user: req.user._id
  }, (err, bookmark) => {
    if (err) return next(err);
    res.status(200).json(bookmark);
  });
});

/* Get the bookmarks of the current user. The results should be sorted by date
 * in descending order. Optionally a query parameter limit can be used to limit
 * the number of results.
 */
router.get('/', function (req, res, next) {

  let query = Bookmark.find({
      user: req.user._id
    }).populate({
      path: 'book',
      select: '-text'
    })
    .sort({
      date: 'desc'
    });
  if (req.query.limit)
    query = query.limit(parseInt(req.query.limit));

  query.exec((err, bookmarks) => {
    if (err) next(err);
    res.status(200).json(bookmarks);
  });
});

/* Add bookmark. Again, the current design does not support setting multiple
 * bookmarks on the same book. It is up to the client to avoid adding more
 * than one bookmark to a book.
 */
router.post('/', function (req, res, next) {

  Sequence.findByIdAndUpdate(sequenceId, {
    $inc: {
      value: 1
    },
  }, (err, sequence) => {
    let bookmark = new Bookmark(req.body);
    bookmark._id = sequence.value;
    bookmark.user = req.user._id;
    bookmark.date = new Date();
    bookmark.save((err) => {
      if (err) return next(err);
      res.status(200).json(bookmark);
    });
  });
});

// Update bookmark - the only updatable fields are position and date
router.put('/book/:bookId', function (req, res, next) {

  Bookmark.findOneAndUpdate({
      book: req.params.bookId,
      user: req.user._id
    }, {
      position: req.body.position,
      date: req.body.date ? req.body.date : new Date()
    }, {
      new: true
    },
    (err, bookmark) => {
      if (err) return next(err);
      res.status(200).json(bookmark);
    });
});

// Update bookmark - the only updatable fields are position and date
router.put('/:id', function (req, res, next) {

  Bookmark.findById(req.params.id, (err, bookmark) => {
    if (err) return next(err);
    if (bookmark.user != req.user._id) {
      res.status(403).json(ApiError.error403());
      return;
    }
    Bookmark.findByIdAndUpdate(req.params.id, {
        position: req.body.position,
        date: req.body.date ? req.body.date : new Date()
      }, {
        new: true
      },
      (err, bookmark) => {
        if (err) return next(err);
        res.status(200).json(bookmark);
      });
  });
});

// Delete bookmark
router.delete('/:id', function (req, res, next) {

  Bookmark.findById(req.params.id, (err, bookmark) => {
    if (err) return next(err);
    if (bookmark.user != req.user._id) {
      res.status(403).json(ApiError.error403());
      return;
    }
    Bookmark.findByIdAndRemove(req.params.id, (err, bookmark) => {
      if (err) return next(err);
      res.status(200).json(bookmark);
    });
  });
});

// Delete all bookmarks
router.delete('/', function (req, res, next) {

  Bookmark.remove({
    user: req.user._id
  }, err => {
    if (err) return next(err);
    res.status(200).end();
  })
});

module.exports = router;
