const mongoose = require('mongoose');

/* The book content file is required and is expected to be a Markdown file with
 * .md or .txt extension. The cover file is optional, and the acceptable
 * extensions are .jpg, .png, and .gif. Generated thumbnail will have the same
 * extenstion (i.e. format) as the uploaded cover.
 */
const bookSchema = new mongoose.Schema({

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

    coverExt: String,

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

});

bookSchema.index({
    title: 'text',
    author: 'text'
});

mongoose.model('Book', bookSchema);
