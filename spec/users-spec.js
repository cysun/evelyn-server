const request = require("request");

const api = request.defaults({
  baseUrl: 'http://localhost:3000/api',
  json: true
});
const cysun = {
  id: '111111111111111111111111',
  username: 'cysun',
  password: 'abcd',
  email: 'cysun@aol.com'
};

describe('Users API Tests:', function () {

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

  it('Update User With No Token', function (done) {
    api.put({
      url: '/users/' + cysun.id,
      body: {
        email: cysun.email
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it('Update User With Cysun Token', function (done) {
    api.put({
      url: '/users/' + cysun.id,
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      },
      body: {
        email: cysun.email
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.email).toBe(cysun.email);
      done();
    });
  });

});
