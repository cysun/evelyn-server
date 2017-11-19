const express = require('express');
const router = express.Router();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

const fileDir = process.env.FILE_DIR;

router.get('/:name', function (req, res, next) {
  res.attachment(req.params.name);
  res.sendFile(req.params.name, {
    root: fileDir
  }, function (err) {
    if (err) {
      winston.error(err);
      next(err);
    }
  });
});

module.exports = router;
