const express = require('express');
const router = express.Router();

const fileDir = process.env.FILE_DIR;
const contentField = 'content';
const coverField = 'cover';
const acceptableExts = ['.md', '.txt', '.jpg', '.png', '.gif'];
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
    destination: fileDir
  }),
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
const fts = require('../fts');

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const mongoose = require('mongoose');
const Book = mongoose.model('Book');
const Sequence = mongoose.model('Sequence');
const sequenceId = process.env.DB_SEQUENCE;
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

// Search books
router.get('/search', function (req, res, next) {

  fts.search(req.query.term, (err, books) => {
    if (err) return next(err);
    res.status(200).json(books);
  });
});

// Reindex books
router.get('/reindex', function (req, res, next) {

  fts.deindexAll();
  fts.indexAll();
  res.status(200).end();
});

// Update ebooks
router.get('/ebooks', function (req, res, next) {

  Book.find({
    deleted: false
  }, (err, books) => {
    books.forEach(book => {
      if (!book.ebookFile) {
        book.ebookFile = book._id + '.epub';
        createEbook(book);
        let update = {
          ebookFile: book.ebookFile
        };
        Book.findByIdAndUpdate(book._id, update, () => {});
        fts.update(book, update);
      } else {
        let ebookFile = path.join(fileDir, book.ebookFile);
        if (fs.lstatSync(ebookFile).mtime < book.date)
          createEbook(book);
      }
    });
    res.status(200).end();
  });
});

// Get book
router.get('/:id', function (req, res, next) {

  Book.findById(req.params.id, (err, book) => {
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
    book.date = new Date();

    if (req.files[coverField]) {
      let uploadedCover = req.files[coverField][0];
      let coverExt = path.extname(uploadedCover.originalname);
      book.coverFile = book._id + 'c' + coverExt;
      book.thumbnailFile = book._id + 't' + coverExt;
      saveCoverFiles(book, uploadedCover);
    }

    let uploadedContent = req.files[contentField][0];
    let contentExt = path.extname(uploadedContent.originalname);
    book.contentFile = book._id + contentExt;
    book.htmlFile = book._id + '.html';
    saveContentFiles(book, uploadedContent);

    book.save((err) => {
      if (err) return next(err);
      res.status(200).json(book);
      winston.info(`${book._id} added by ${req.user.username}.`);
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

    if (req.files[coverField]) {
      let uploadedCover = req.files[coverField][0];
      let coverExt = path.extname(uploadedCover.originalname);
      book.coverFile = book._id + 'c' + coverExt;
      book.thumbnailFile = book._id + 't' + coverExt;
      saveCoverFiles(book, uploadedCover);
    }

    if (req.files[contentField]) {
      let uploadedContent = req.files[contentField][0];
      saveContentFiles(book, uploadedContent, req.body.append);
    } else {
      fts.index(book);
    }

    Book.updateOne({
      _id: book._id
    }, book, {
      runValidators: true
    }, err => {
      if (err) return next(err);
      res.status(200).end();
      winston.info(`${book._id} updated by ${req.user.username}.`);
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
    fts.deindex(book);
    res.status(200).json(book);
    winston.info(`${book._id} deleted by ${req.user.username}.`);
  });
});

const sharp = require('sharp');
const marked = require('marked');
const Epub = require('epub-gen');
const Ebook = require('../utils/ebook');

function saveCoverFiles(book, file) {
  let coverFile = path.join(fileDir, book.coverFile);
  fs.rename(file.path, coverFile, err => {
    if (err) throw err;
    let thumbnailFile = path.join(fileDir, book.thumbnailFile);
    sharp(coverFile).resize(48).toFile(thumbnailFile, err => {
      if (err) throw err;
    });
  });
}

function saveContentFiles(book, file, append) {
  let contentFile = path.join(fileDir, book.contentFile);
  if (append) {
    fs.readFile(file.path, (err, data) => {
      if (err) throw err;
      fs.appendFile(contentFile, data, (err) => {
        if (err) throw err;
        createHtmlFile(book);
        fts.index(book);
      });
      fs.unlink(file.path, err => winston.error(err));
    });
  } else {
    fs.rename(file.path, contentFile, (err) => {
      if (err) throw err;
      createHtmlFile(book);
      fts.index(book);
    });
  }
}

function createHtmlFile(book) {
  let index = 1;
  let renderer = new marked.Renderer();
  renderer.paragraph = function (text) {
    return '<p data-index="' + index++ + '">' + text + "</p>";
  };
  let contentFile = path.join(fileDir, book.contentFile);
  let htmlFile = path.join(fileDir, book.htmlFile);
  fs.readFile(contentFile, (err, data) => {
    if (err) throw err;
    fs.writeFile(htmlFile, marked(data.toString(), {
      renderer
    }), err => {
      if (err) throw err;
    });
  });
}

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
