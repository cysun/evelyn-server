const fileDir = process.env.APP_DIR + "/files/";

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const showdown = require('showdown');
const converter = new showdown.Converter();

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

function Ebook(book, callback) {

  let ebook = {
    chapters: []
  };
  if (book.coverExt)
    ebook.cover = path.join(fileDir, book._id + '-cover' + book.coverExt);

  let chapter = {
    data: ''
  };

  function closeChapter() {
    if (!chapter.title)
      chapter.title = ebook.title;
    chapter.data = converter.makeHtml(chapter.data);
    ebook.chapters.push(chapter);
  }

  let reader = readline.createInterface({
    input: fs.createReadStream(path.join(fileDir, book._id + '-content.md'))
  });

  reader.on('line', (line) => {
    if (line.startsWith('###')) {
      ebook.author = line.substring(4).trim();
    } else if (line.startsWith('##')) {
      closeChapter();
      chapter = {
        title: line.substring(3).trim(),
        data: ''
      };
    } else if (line.startsWith('#')) {
      ebook.title = line.substring(1).trim();
    } else {
      chapter.data += line + '\n';
    }
  });

  reader.on('close', () => {
    closeChapter();
    winston.debug(`Finished reading book ${book._id}`);
    callback(ebook);
  })
}

module.exports = Ebook;
