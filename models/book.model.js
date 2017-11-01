const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    contentType: {
        type: String,
        required: true
    }

});

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

    content: {
        type: fileSchema,
        required: true
    },

    cover: fileSchema,

    thumbnail: fileSchema,

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

mongoose.model('File', fileSchema);
mongoose.model('Book', bookSchema);
