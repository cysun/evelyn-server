const _ = require('lodash');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  _id: Number,

  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },

  hash: String, // use bcrypt so no need for separate salt field

  enabled: {
    type: Boolean,
    required: true,
    default: true
  }

});

userSchema.methods.excludeFields = function (fields = ['hash']) {
  return _.omit(this.toObject(), fields);
}

mongoose.model('User', userSchema);
