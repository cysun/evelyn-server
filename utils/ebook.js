const fileDir = process.env.APP_DIR + "/files/";

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const marked = require('marked');

const winston = require('winston');
winston.level = process.env.LOG_LEVEL || 'info';

function Ebook(book, callback) {

  let ebook = {
    title: book.title,
    author: book.author,
    publisher: 'Evelyn Digital Library',
    chapters: []
  };
  if (book.coverFile)
    ebook.cover = path.join(fileDir, book.coverFile);

  let chapter = {
    data: ''
  };

  function closeChapter() {
    if (!chapter.title)
      chapter.title = ebook.title;
    chapter.data = marked(chapter.data);
    ebook.chapters.push(chapter);
  }

  let reader = readline.createInterface({
    input: fs.createReadStream(path.join(fileDir, book.contentFile))
  });

  reader.on('line', (line) => {
    if (line.startsWith('##')) {
      closeChapter();
      chapter = {
        title: line.substring(3).trim(),
        data: ''
      };
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
