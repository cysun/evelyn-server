const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'no secret??';
const jwtOptions = {
  expiresIn: process.env.JWT_EXPIRE || '7d'
};

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';
winston.debug('JWT:', {
  secret: jwtSecret,
  expiresIn: jwtOptions.expiresIn
});

const ApiError = require('../models/error.model');
const msg400 = 'Missing username and/or password.';
const msg500 = 'Unable to authenticate user.';
const msg401 = 'Bad credentials.';
const msg403 = 'Account disabled.';

const User = require('mongoose').model('User');

router.post('/', function (req, res, next) {

  if (!req.body.username || !req.body.password) {
    res.status(400).json(new ApiError(msg400));
    return;
  }

  User.findOne({
    username: req.body.username.toLowerCase()
  }, function (err, user) {
    if (err) {
      winston.error(msg500, err);
      res.status(500).json(new ApiError(msg500));
      return;
    }

    if (!user) {
      res.status(401).json(new ApiError(msg401));
      return;
    }

    if (!user.enabled) {
      res.status(403).json(new ApiError(msg403));
      return;
    }

    bcrypt.compare(req.body.password, user.hash, function (err, success) {
      if (!success) {
        res.status(401).json(new ApiError(msg401));
        return;
      }

      user = user.excludeFields();
      res.status(200).json({
        token: jwt.sign(user, jwtSecret, jwtOptions)
      });
      winston.info(`${user.username} logged in successfully.`);
    });
  });
});

module.exports = router;
