const mongoose = require('mongoose');

/* The book content file is required and is expected to be a Markdown file with
 * .md or .txt extension. The cover file is optional, and the acceptable
 * extensions are .jpg, .png, and .gif. Generated thumbnail will have the same
 * extenstion (i.e. format) as the uploaded cover.
 */
const bookSchema = new mongoose.Schema({

  _id: Number,

  title: {
    type: String,
    required: true,
    unique: true
  },

  author: {
    type: String,
    required: true
  },

  notes: String,

  text: String, // original text, used for fts

  contentFile: String, // the name of the uploaded content file

  htmlFile: String, // the name of the converted html file

  coverFile: String, // the name of the uploaded cover file

  thumbnailFile: String, // the name of the converted thumbnail file

  date: {
    type: Date,
    required: true,
    default: Date.now
  },

  deleted: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  toJSON: {
    virtuals: true
  }
});

bookSchema.index({
  title: 'text',
  author: 'text',
  text: 'text'
}, {
  weights: {
    title: 10,
    author: 10,
    text: 1
  },
  name: "BooksTextIndex"
});

mongoose.model('Book', bookSchema);
