require('dotenv').config();

const dbURI = process.env.APP_DB_URI || 'mongodb://localhost/evelyn';
const mongodb = require('mongodb');
const fts = require('../fts');

const readlineSync = require('readline-sync');
var userId = 1000;
const users = [];
const bcrypt = require('bcrypt');
const saltRounds = 10;

function createUsers() {
  console.log('add <username> <password> | done');
  readlineSync.promptCLLoop({
    add: function (username, password) {
      users.push({
        _id: userId++,
        username: username,
        email: username + '@localhost.localdomain',
        hash: bcrypt.hashSync(password, saltRounds),
        enabled: true,
        _v: 0
      });
      console.log(users);
    },
    done: function () {
      return true;
    }
  });
}

async function dropCollections(db) {
  collections = await db.collections();
  for (let i = 0; i < collections.length; ++i)
    await collections[i].drop();
  return collections.length;
}

async function createIdSequence(db) {
  return db.collection('sequences').insertOne({
    _id: 'evelyn-sequence',
    value: 1000000
  });
}

async function dbinit() {
  const db = await mongodb.MongoClient.connect(dbURI);

  result = await dropCollections(db);
  console.log(`${result} collection(s) dropped.`);

  result = await createIdSequence(db);
  console.log(`${result.insertedCount} sequence(s) created.`);

  result = await db.collection('users').insertMany(users);
  console.log(`${result.insertedCount} user(s) inserted.`);

  db.close();
}

createUsers();
dbinit();
fts.deindexAll();
