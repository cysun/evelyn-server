const express = require('express');
const router = express.Router();

const contentField = 'content';
const coverField = 'cover';
const acceptableExts = ['.md', '.txt', '.jpg', '.png', '.gif'];
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, callback) {
    let ext = path.extname(file.originalname).toLowerCase();
    callback(null, acceptableExts.includes(ext));
  }
}).fields([{
  name: contentField
}, {
  name: coverField
}]);

const fs = require('fs');
const path = require('path');

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const mongoose = require('mongoose');
const Book = mongoose.model('Book');
const Sequence = mongoose.model('Sequence');
const sequenceId = process.env.APP_SEQUENCE || 'app-sequence';
const ApiError = require('../models/error.model');

/* Get all books. The results should be sorted by date in descending order.
 * Optionally a query parameter limit can be used to limit the number of
 * results.
 */
router.get('/', function (req, res, next) {

  let query = Book.find({
    deleted: false
  }).select('-text').sort({
    date: 'desc'
  });
  if (req.query.limit)
    query = query.limit(parseInt(req.query.limit));

  query.exec((err, books) => {
    if (err) next(err);
    res.status(200).json(books);
  });
});

// Search books
router.get('/search', function (req, res, next) {

  Book.find({
      $text: {
        $search: req.query.term
      }
    }, {
      score: {
        $meta: "textScore"
      }
    })
    .select('-text')
    .sort({
      score: {
        $meta: "textScore"
      }
    }).exec((err, books) => {
      if (err) return next(err);
      res.status(200).json(books);
    });
});

// Get book
router.get('/:id', function (req, res, next) {

  Book.findById(req.params.id, '-text', (err, book) => {
    if (err) return next(err);
    if (!book.deleted)
      res.status(200).json(book);
    else
      res.status(404).json(ApiError.error404());
  });
});

// Add book
router.post('/', upload, function (req, res, next) {

  if (!req.files[contentField]) {
    res.status(400).json(new ApiError('Content file is required.'));
    return;
  }

  Sequence.findByIdAndUpdate(sequenceId, {
    $inc: {
      value: 1
    },
  }, (err, sequence) => {
    let book = new Book(req.body);
    book._id = sequence.value;

    let uploadedContent = req.files[contentField][0];
    let contentExt = path.extname(uploadedContent.originalname);
    book.text = uploadedContent.buffer.toString();
    book.contentFile = book._id + contentExt;
    book.htmlFile = book._id + '.html';
    book.ebookFile = book._id + '.epub';
    saveContentFiles(book, uploadedContent);

    if (req.files[coverField]) {
      let uploadedCover = req.files[coverField][0];
      let coverExt = path.extname(uploadedCover.originalname);
      book.coverFile = book._id + 'c' + coverExt;
      book.thumbnailFile = book._id + 't' + coverExt;
      saveCoverFiles(book, uploadedCover);
    }

    createEbook(book);

    book.save((err) => {
      if (err) return next(err);
      res.status(200).json(book.excludeFields());
      winston.info(`${book.title} added by ${req.user.username}.`);
    });
  });
});

// Update book
router.put('/:id', upload, function (req, res, next) {

  Book.findById(req.params.id, (err, book) => {
    if (err) return next(err);

    book.title = req.body.title;
    book.author = req.body.author;
    book.date = new Date();
    if (req.body.notes) {
      book.notes = req.body.notes;
    }

    if (req.files[contentField]) {
      let uploadedContent = req.files[contentField][0];
      if (req.body.append) {
        book.text += uploadedContent.buffer;
      } else {
        let contentExt = path.extname(uploadedContent.originalname);
        book.contentFile = book._id + contentExt;
        book.text = uploadedContent.buffer;
      }
      saveContentFiles(book, uploadedContent, req.body.append);
    }

    if (req.files[coverField]) {
      let uploadedCover = req.files[coverField][0];
      let coverExt = path.extname(uploadedCover.originalname);
      book.coverFile = book._id + 'c' + coverExt;
      book.thumbnailFile = book._id + 't' + coverExt;
      saveCoverFiles(book, uploadedCover);
    }

    if (req.files[contentField]) {
      createEbook(book);
    }

    Book.updateOne({
      _id: book._id
    }, book, {
      new: true,
      runValidators: true
    }, (err, book) => {
      if (err) return next(err);
      res.status(200).json(book);
      winston.info(`${book.title} updated by ${req.user.username}.`);
    });
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

const fileDir = process.env.APP_DIR + "/files/";

const marked = require('marked');

function saveContentFiles(book, file, append) {
  console.log(`Append: ${append}`);
  let contentFile = path.join(fileDir, book.contentFile);
  if (append) {
    fs.appendFile(contentFile, file.buffer, err => {
      if (err) throw err;
    });
  } else {
    fs.writeFile(contentFile, file.buffer, err => {
      if (err) throw err;
    })
  }

  var index = 1;
  let renderer = new marked.Renderer();
  renderer.paragraph = function (text) {
    return '<p data-index="' + index++ + '">' + text + "</p>";
  };

  let htmlFile = path.join(fileDir, book.htmlFile);
  fs.writeFile(htmlFile, marked(book.text, {
    renderer
  }), err => {
    if (err) throw err;
  });
}

const sharp = require('sharp');

function saveCoverFiles(book, file) {
  let coverFile = path.join(fileDir, book.coverFile);
  fs.writeFile(coverFile, file.buffer, err => {
    if (err) throw err;
    let thumbnailFile = path.join(fileDir, book.thumbnailFile);
    sharp(coverFile).resize(48).toFile(thumbnailFile, err => {
      if (err) throw err;
    });
  });
}

const Epub = require('epub-gen');
const Ebook = require('../utils/ebook');

function createEbook(book) {
  Ebook(book, ebook => {
    new Epub({
      title: ebook.title,
      author: ebook.author,
      cover: ebook.cover,
      content: ebook.chapters,
      output: path.join(fileDir, book.ebookFile)
    });
  });
}

module.exports = router;
