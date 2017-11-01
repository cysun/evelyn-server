const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const ApiError = require('../models/error.model');

const _ = require('lodash');
const User = require('mongoose').model('User');

// Update User -- note that only certain fields are allowed to be changed.
router.put('/:id', function (req, res, next) {

  if (req.user._id !== req.params.id) {
    res.status(403).json(ApiError.error403());
    return;
  }

  var update = _.pick(req.body, ['username', 'email']);
  if (req.body.password)
    update.hash = bcrypt.hashSync(req.body.password, saltRounds);

  User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true
  }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      res.status(404).json(ApiError.error404());
      return;
    }
    res.status(200).json(user.excludeFields());
    winston.info(`${user.username} updated.`);
  });
});

module.exports = router;
