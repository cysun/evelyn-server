require('dotenv').config();
const dbURI = process.env.EVELYN_DBURI || 'mongodb://localhost/evelyn';
const mongodb = require('mongodb');

async function dbinit() {

    const db = await mongodb.MongoClient.connect(dbURI);

    let result = await db.collection('users').deleteMany();
    console.log(`${result.deletedCount} document(s) deleted from users.`);

    result = await db.collection('books').deleteMany();
    console.log(`${result.deletedCount} document(s) deleted from books.`);

    result = await db.collection('bookmarks').deleteMany();
    console.log(`${result.deletedCount} document(s) deleted from bookmarks.`);

    result = await insertUsers(db);
    console.log(`${result.insertedCount} document(s) inserted into users.`);

    result = await insertBooks(db);
    console.log(`${result.insertedCount} document(s) inserted into books.`);

    result = await insertBookmarks(db);
    console.log(`${result.insertedCount} document(s) inserted into bookmarks.`);

    db.close();
}

dbinit();

function insertUsers(db) {
    return db.collection('users').insertMany([{
        _id: new mongodb.ObjectID('111111111111111111111111'),
        username: 'cysun',
        email: 'cysun@localhost.localdomain',
        hash: '$2a$10$hWdt2pb2qpMUD/Lheti1FeXSqZl.Bt3vCunep10cu6GvjDREwIgua',
        enabled: true,
        __v: 0
    }, {
        _id: new mongodb.ObjectID('222222222222222222222222'),
        username: 'jdoe',
        email: 'jdoe@localhost.localdomain',
        hash: '$2a$10$hWdt2pb2qpMUD/Lheti1FeXSqZl.Bt3vCunep10cu6GvjDREwIgua',
        enabled: false,
        __v: 0
    }]);
}

function insertBooks(db) {
    return db.collection('books').insertMany([{
        _id: new mongodb.ObjectID('111111111111111111111111'),
        title: 'Test Book 1',
        author: 'John Doe',
        content: {
            _id: new mongodb.ObjectID('111111111111111111111111'),
            name: 'test-book-1.txt',
            contentType: 'plain/text'
        },
        date: new Date(2016, 5, 15),
        deleted: false,
        __v: 0
    }, {
        _id: new mongodb.ObjectID('222222222222222222222222'),
        title: 'Test Book 2',
        author: 'Jane Doe',
        content: {
            _id: new mongodb.ObjectID('222222222222222222222222'),
            name: 'test-book-2.txt',
            contentType: 'plain/text'
        },
        date: new Date(2017, 9, 10),
        deleted: false,
        __v: 0
    }]);
}

function insertBookmarks(db) {
    return db.collection('bookmarks').insertMany([{
        _id: new mongodb.ObjectID('111111111111111111111111'),
        book: new mongodb.ObjectID('111111111111111111111111'),
        user: new mongodb.ObjectID('111111111111111111111111'),
        position: 1,
        date: new Date(2016, 5, 16),
        __v: 0
    }, {
        _id: new mongodb.ObjectID('222222222222222222222222'),
        book: new mongodb.ObjectID('222222222222222222222222'),
        user: new mongodb.ObjectID('222222222222222222222222'),
        position: 2,
        date: new Date(2017, 10, 1),
        __v: 0
    }, {
        _id: new mongodb.ObjectID('333333333333333333333333'),
        book: new mongodb.ObjectID('222222222222222222222222'),
        user: new mongodb.ObjectID('111111111111111111111111'),
        position: 3,
        date: new Date(2017, 9, 20),
        __v: 0
    }]);
}
