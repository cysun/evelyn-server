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

describe('Bookmarks API Tests:', function () {

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

  it('Get Bookmark By Id As Owner', function (done) {
    api.get({
      url: '/bookmarks/3000',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.position).toBe(1);
      done();
    });
  });

  it('Get Bookmark By Id As Non-Owner', function (done) {
    api.get({
      url: '/bookmarks/3001',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(403);
      done();
    });
  });

  it('Get Bookmark By Book Id', function (done) {
    api.get({
      url: '/bookmarks/book/2000',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.position).toBe(1);
      done();
    });
  });

  it('Get Bookmarks By User', function (done) {
    api.get({
      url: '/bookmarks/',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.length).toBe(2);
      expect(body[0].position).toBe(3);
      done();
    });
  });

  it('Get Bookmarks By User With Limit', function (done) {
    api.get({
      url: '/bookmarks/?limit=1',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      expect(body.length).toBe(1);
      expect(body[0].position).toBe(3);
      done();
    });
  });

  it('Add Bookmark', function (done) {
    api.post({
      url: '/bookmarks/',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      },
      body: {
        book: '2002',
        position: 1
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      done();
    });
  });


  it('Update Bookmark As Owner', function (done) {
    api.put({
      url: '/bookmarks/3000',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      },
      body: {
        position: 2
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it('Update Bookmark As Non-Owner', function (done) {
    api.put({
      url: '/bookmarks/3001',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      },
      body: {
        position: 2
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(403);
      done();
    });
  });

  it('Delete Bookmark As Owner', function (done) {
    api.delete({
      url: '/bookmarks/3000',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(200);
      done();
    });
  });

  it('Delete Bookmark As Non-Owner', function (done) {
    api.delete({
      url: '/bookmarks/3001',
      headers: {
        'Authorization': 'Bearer ' + cysunToken
      },
      body: {
        position: 2
      }
    }, function (err, res, body) {
      expect(res.statusCode).toBe(403);
      done();
    });
  });

});
