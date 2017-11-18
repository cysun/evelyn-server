require('dotenv').config();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const request = require("request").defaults({
  baseUrl: process.env.APP_FTS_URI || 'http://localhost:9200/evelyn',
  json: true
});

const fileDir = process.env.APP_DIR + "/files/";
const fs = require('fs');
const path = require('path');

exports.deindex = function (book) {
  request.delete('/book/' + book._id, (err) => {
    if (err) winston.error(`Failed to delete book ${book._id}`);
    else winston.info(`Book ${book._id} removed from fts index`);
  });
}

exports.deindexAll = function () {
  request.delete('/', (err) => {
    if (err) winston.error('Failed to delete index');
    else winston.info('FTS index deleted');
    request.put({
      uri: '/',
      body: JSON.parse(fs.readFileSync(path.join(__dirname, 'evelyn.mappings.json')))
    }, (err) => {
      if (err) winston.error('Fail to create index');
      else winston.info('FTS index created');
    });
  });
}

exports.index = function (book) {
  request.put({
    uri: '/book/' + book._id,
    body: {
      "title": book.title,
      "author": book.author,
      "note": book.notes,
      "text": fs.readFileSync(path.join(fileDir, book.contentFile)).toString(),
      "contentFile": book.contentFile,
      "htmlFile": book.htmlFile,
      "ebookFile": book.ebookFile,
      "coverFile": book.coverFile,
      "thumbnailFile": book.thumbnailFile,
      "date": book.date
    }
  }, (err) => {
    if (err) winston.error(`Fail to index book ${book._id}`);
    else winston.info(`Book ${book._id} fts indexed`);
  });
}

const dbURI = process.env.APP_DB_URI || 'mongodb://localhost/evelyn';
const mongodb = require('mongodb');

exports.indexAll = function () {
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      winston.error('Failed to connect to db');
      return;
    }

    db.collection('books').find({}).toArray(function (err, books) {
      if (err) {
        winston.error('Failed to query db')
      } else {
        books.forEach(index(book));
      }
      db.close();
    });
  });
}

exports.reindexAll = function () {
  deindexAll();
  indexAll();
}

exports.search = function (term, cb) {
  request.post({
    uri: '/book/_search',
    body: {
      "_source": {
        "excludes": ["text"]
      },
      "query": {
        "multi_match": {
          "query": term,
          "fields": ["title", "author", "notes", "text"]
        }
      }
    }
  }, (err, res, body) => cb(err, body.hits.hits.map(hit => {
    return {
      _id: hit._id,
      title: hit._source.title,
      author: hit._source.author,
      notes: hit._source.notes,
      contentFile: hit._source.contentFile,
      htmlFile: hit._source.htmlFile,
      ebookFile: hit._source.ebookFile,
      coverFile: hit._source.coverFile,
      thumbnailFile: hit._source.thumbnailFile,
      date: hit._source.date
    };
  })));
}
