const mongoose = require('mongoose');

/* Use a single Mongo document to create a unique id sequence. This approach
 * is not recommended for a busy system (see a discussion at
 * https://www.mongodb.com/blog/post/generating-globally-unique-identifiers-for-use-with-mongodb),
 * but EDL is a system for personal use so contention will not be a problem, and
 * on the plus side, having an id before saving a new book to the database makes
 * the code quite a bit cleaner.
 */
const sequenceSchema = new mongoose.Schema({

  _id: String,

  value: Number

});

mongoose.model('Sequence', sequenceSchema);
