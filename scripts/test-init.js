require('dotenv').config();
const mongodb = require('mongodb');
const fts = require('../fts');

dbinit();
fts.deindexAll();

async function dbinit() {
  const db = await mongodb.MongoClient.connect(process.env.DB_URI);

  result = await db.authenticate(process.env.DB_USER, process.env.DB_PASS);
  console.log(`Authentication successful: ${result}`);

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
  collections = await db.collections();
  for (let i = 0; i < collections.length; ++i)
    await collections[i].drop();
  return collections.length;
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
