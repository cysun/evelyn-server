/* The JavaScript Error object cannot be easily serialized to JSON (see a discussion at
 * https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify),
 * so for convenience we create our own error class to send error information
 * back to API callers. Currently there's only one message field in the class,
 * but in the future we may expand it to include fields like error code.
 */
module.exports = class ApiError {

    constructor(message) {
        this.error = {};
        this.error.message = message;
    }

    static error401() {
        return new ApiError('Authentication failed');
    }

    static error403() {
        return new ApiError('Access denied.')
    }

    static error404() {
        return new ApiError('Resource not found.');
    }

}
