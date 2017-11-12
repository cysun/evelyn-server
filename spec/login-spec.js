const request = require("request");

const loginApi = request.defaults({
  url: 'http://localhost:3000/api/login',
  json: true
});
const goodCredentials = {
  username: 'cysun',
  password: 'abcd'
};
const badCredentials = {
  username: 'cysun',
  password: '1234'
};
const badRequest = {
  email: 'cysun',
  password: 'abcd'
};

describe("Login API Tests:", function () {

  it("Successful Login", function (done) {
    loginApi.post({
      body: goodCredentials
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.token).toBeDefined();
      done();
    });
  });

  it("Bad Credentials", function (done) {
    loginApi.post({
      body: badCredentials
    }, function (err, res, body) {
      expect(res.statusCode).toBe(401);
      done();
    });
  });

  it("Bad Request", function (done) {
    loginApi.post({
      body: badRequest
    }, function (err, res, body) {
      expect(res.statusCode).toBe(400);
      done();
    });
  });

});
