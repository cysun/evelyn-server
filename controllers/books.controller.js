const express = require('express');
const router = express.Router();

const contentField = 'content';
const coverField = 'cover';
const fileDir = process.env.APP_DIR + "/files/";
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
const sharp = require('sharp');
const Epub = require('epub-gen');
const Ebook = require('../utils/ebook');

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

// Search books
router.get('/search', function (req, res, next) {

    Book.find({
        $text: {
            $search: req.query.term
        }
    }, (err, books) => {
        if (err) return next(err);
        res.status(200).json(books);
    });
});

// Get book
router.get('/:id', function (req, res, next) {

    Book.findById(req.params.id, (err, book) => {
        if (err) return next(err);
        res.status(200).json(book);
    });
});

// Get Ebook
router.get('/:id/ebook', function (req, res, next) {

    Book.findById(req.params.id, (err, book) => {
        if (err) return next(err);
        Ebook(book, (ebook) => {
            new Epub({
                title: ebook.title,
                author: ebook.author,
                cover: ebook.cover,
                content: ebook.chapters,
                output: path.join(fileDir, book._id + '.epub')
            }).promise.then(function () {
                res.status(200).json(book);
            }, function (err) {
                return next(err);
            });
        });
    });
});

// Add book
router.post('/', upload, function (req, res, next) {

    if (!req.files[contentField]) {
        res.status(400).json(new ApiError('Content file is required.'));
        return;
    }

    let book = new Book(req.body);
    if (req.files[coverField])
        book.coverExt = path.extname(req.files[coverField][0].originalname);
    book.save((err) => {
        if (err) return next(err);
        saveFiles(book, req);
        res.status(200).json(book);
        winston.info(`${book.title} added by ${req.user.username}.`);
    });
});

// Update book
router.put('/:id', upload, function (req, res, next) {

    if (req.files[coverField])
        req.body.coverExt = path.extname(req.files[coverField][0].originalname);

    Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }, (err, book) => {
        if (err) return next(err);
        saveFiles(book, req, req.body.append);
        res.status(200).json(book);
        winston.info(`${book.title} updated by ${req.user.username}.`);
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

function saveFiles(book, req, append) {

    if (!req.files) return;

    if (req.files[contentField]) {
        let file = req.files[contentField][0];
        let content = path.join(fileDir, book._id + '-content.md');
        if (append) {
            fs.readFile(file.path, (err, data) => {
                if (err) throw err;
                fs.appendFile(content, data, (err) => {
                    if (err) throw err;
                });
            });
        } else {
            fs.rename(file.path, content, (err) => {
                if (err) throw err;
            });
        }
    }

    if (req.files[coverField]) {
        file = req.files[coverField][0];
        let ext = path.extname(file.originalname);
        let cover = path.join(fileDir, book._id + '-cover' + ext);
        fs.rename(file.path, cover, (err) => {
            if (err) throw err
            let thumbnail = path.join(fileDir, book._id + '-thumbnail' + ext);
            sharp(cover).resize(48).toFile(thumbnail, (err) => {
                if (err) throw err;
            });
        });
    }
}

module.exports = router;
