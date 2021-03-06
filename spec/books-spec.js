const request = require("request");

const api = request.defaults({
  baseUrl: 'http://localhost:3000/api',
  json: true
});
const cysun = {
  id: 1000,
  username: 'cysun',
  password: 'abcd',
  email: 'cysun@aol.com'
};

describe('Books API Tests:', function () {

  let cysunToken = '';

  beforeAll(function (done) {
    api.post({
      url: '/login',
      body: cysun
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      cysunToken = body.token;
      done();
    });
  });

  it('Get All Books', function (done) {
    api.get({
      url: '/books/',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.length).toBe(2);
      expect(body[0].title).toBe('Weather Games');
      done();
    });
  });

});
