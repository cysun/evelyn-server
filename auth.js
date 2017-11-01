const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwtSecret = process.env.JWT_SECRET || 'no secret??';

const ApiError = require('./models/error.model');

/* passport-jwt verifies the signature and decode the payload. the done()
 * function will set the payload to be req.user so the subsequent middleware
 * functions can access it. If signature verificatin fails ???
 */
passport.use(new passportJWT.Strategy({
    secretOrKey: jwtSecret,
    jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
}, function (payload, done) {
    return done(null, payload);
}));

module.exports = passport;
