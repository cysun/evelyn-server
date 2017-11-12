const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({

  book: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },

  user: {
    type: Schema.Types.ObjectId,
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
}, {
  toJSON: {
    virtuals: true
  }
});

mongoose.model('Bookmark', bookmarkSchema);
