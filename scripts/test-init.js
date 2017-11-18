require('dotenv').config();
const dbURI = process.env.APP_DB_URI || 'mongodb://localhost/evelyn';
const mongodb = require('mongodb');
const indexer = require('../indexer');

dbinit();
indexer.deindexAll();

async function dbinit() {
  const db = await mongodb.MongoClient.connect(dbURI);

  result = await dropCollections(db);
  console.log(`${result} collection(s) dropped.`);

  result = await createIdSequence(db);
  console.log(`${result.insertedCount} sequence(s) created.`);

  result = await insertUsers(db);
  console.log(`${result.insertedCount} document(s) inserted into users.`);

  result = await insertBooks(db);
  console.log(`${result.insertedCount} document(s) inserted into books.`);

  result = await insertBookmarks(db);
  console.log(`${result.insertedCount} document(s) inserted into bookmarks.`);

  db.close();
}

async function dropCollections(db) {
  let collections = [];
  await db.collections().then(results => collections = results);
  for (let i = 0; i < collections.length; ++i)
    await collections[i].drop();
}

function createIdSequence(db) {
  return db.collection('sequences').insertOne({
    _id: 'evelyn-sequence',
    value: 1000000
  });
}

function insertUsers(db) {
  return db.collection('users').insertMany([{
    _id: 1000,
    username: 'cysun',
    email: 'cysun@localhost.localdomain',
    hash: '$2a$10$hWdt2pb2qpMUD/Lheti1FeXSqZl.Bt3vCunep10cu6GvjDREwIgua',
    enabled: true,
    __v: 0
  }, {
    _id: 1001,
    username: 'jdoe',
    email: 'jdoe@localhost.localdomain',
    hash: '$2a$10$hWdt2pb2qpMUD/Lheti1FeXSqZl.Bt3vCunep10cu6GvjDREwIgua',
    enabled: false,
    __v: 0
  }]);
}

function insertBooks(db) {
  return db.collection('books').insertMany([{
    _id: 2000,
    title: 'Programming JavaScript',
    author: 'John Doe',
    date: new Date(2016, 5, 15),
    deleted: false,
    __v: 0
  }, {
    _id: 2001,
    title: 'Weather Games',
    author: 'Jane Doe',
    date: new Date(2017, 9, 10),
    deleted: false,
    __v: 0
  }]);
}

function insertBookmarks(db) {
  return db.collection('bookmarks').insertMany([{
    _id: 3000,
    book: 2000,
    user: 1000,
    position: 1,
    date: new Date(2016, 5, 16),
    __v: 0
  }, {
    _id: 3001,
    book: 2001,
    user: 1001,
    position: 2,
    date: new Date(2017, 10, 1),
    __v: 0
  }, {
    _id: 3002,
    book: 2001,
    user: 1000,
    position: 3,
    date: new Date(2017, 9, 20),
    __v: 0
  }]);
}
