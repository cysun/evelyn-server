/* environment variables, database, and security */

require('dotenv').config();
require('./db');
const passport = require('./auth');

/* express app */

const path = require('path');
const express = require('express');
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/* common express middleware */

const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

/* route-handling middleware (i.e. controllers) */

const login = require('./controllers/login.controller');
const users = require('./controllers/users.controller');
const books = require('./controllers/books.controller');
const files = require('./controllers/files.controller');
const bookmarks = require('./controllers/bookmarks.controller');

app.use('/api/login', login);
app.use('/api/', passport.authenticate('jwt', {
  session: false,
  failWithError: true
}));

// everything after this requires authentication
app.use('/api/users', users);
app.use('/api/books', books);
app.use('/api/files', files);
app.use('/api/bookmarks', bookmarks);

/* error-handling middleware */

const ApiError = require('./models/error.model');
const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// api error handler
app.use(function (err, req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    res.status(err.status || 500).json(new ApiError(err.message));
    if (err.status == 401)
      winston.error('Authentication failed.');
    else
      winston.error(err);
    return;
  }
  next(err);
});

// web page error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
