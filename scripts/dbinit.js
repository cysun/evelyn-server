require('dotenv').config();
const dbURI = process.env.EVELYN_DBURI || 'mongodb://localhost/evelyn';
const mongodb = require('mongodb');

async function dbinit() {

    const db = await mongodb.MongoClient.connect(dbURI);

    let result = await db.collection('users').deleteMany();
    console.log(`${result.deletedCount} document(s) deleted from users.`);

    result = await insertUsers(db);
    console.log(`${result.insertedCount} document(s) inserted into users`);

    db.close();
}

dbinit();

function insertUsers(db) {
    return db.collection('users').insertOne({
        _id: new mongodb.ObjectID('111111111111111111111111'),
        username: 'cysun',
        email: 'cysun@localhost.localdomain',
        hash: '$2a$10$hWdt2pb2qpMUD/Lheti1FeXSqZl.Bt3vCunep10cu6GvjDREwIgua',
        enabled: true,
        __v: 0
    });
}
