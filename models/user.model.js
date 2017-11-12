const _ = require('lodash');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

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
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

userSchema.methods.excludeFields = function (fields = ['hash']) {
  return _.omit(this.toObject(), fields);
}

mongoose.model('User', userSchema);
