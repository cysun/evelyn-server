/* Adopted from code by Simon Holms at
 * https://github.com/simonholmes/getting-MEAN-2/
 */
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const dbURI = process.env.EVELYN_DBURI || 'mongodb://localhost/evelyn';
mongoose.Promise = bluebird;
mongoose.connect(dbURI, {
    useMongoClient: true,
    promiseLibrary: bluebird
});

mongoose.connection.on('connected', () => {
    winston.info(`Mongoose connected to ${dbURI}`);
});

mongoose.connection.on('error', err => {
    winston.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    winston.info('Mongoose disconnected');
});

const shutdown = (msg, callback) => {
    mongoose.connection.close(() => {
        winston.info(`Mongoose disconnected through ${msg}`);
        callback();
    });
};

// For nodemon restarts                                 
process.once('SIGUSR2', () => {
    shutdown('nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// For app termination
process.on('SIGINT', () => {
    shutdown('app termination', () => {
        process.exit(0);
    });
});

// For Heroku app termination
process.on('SIGTERM', () => {
    shutdown('Heroku app shutdown', () => {
        process.exit(0);
    });
});

// Load the models
require('./models/user.model');
require('./models/book.model');
require('./models/bookmark.model');
