const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({

  _id: Number,

  book: {
    type: Number,
    ref: 'Book',
    required: true
  },

  user: {
    type: Number,
    ref: 'User',
    required: true
  },

  position: {
    type: Number,
    required: true,
    default: 0
  },

  date: {
    type: Date,
    required: true,
    default: Date.now
  }

});

mongoose.model('Bookmark', bookmarkSchema);
