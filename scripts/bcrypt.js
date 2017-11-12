const bcrypt = require('bcrypt');
const saltRounds = 10;

process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
  process.stdout.write("Please enter the password to encrypt. Use Ctrl-C to exit.\n");
  const password = process.stdin.read();
  if (password !== null) {
    let hash = bcrypt.hashSync(password, saltRounds);
    process.stdout.write(`hash: ${hash}\n`);
  }
});
