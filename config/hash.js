var crypto = require('crypto');

/**
 * Bytesize.
 */

var len = 128;
//usually recommended as 2000 but we'll increase it since we are small :)
var iterations = 12000;

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `fn(err, salt, hash)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */

module.exports = function (pwd, salt, fn) {
    if (3 == arguments.length) {
        try {
            crypto.pbkdf2(pwd, salt, iterations, len, fn); }
        catch(e) {
            console.log("hash.js - unable to hash password " + e);
            fn(e, null, null);
        }
    } else {
        fn = salt;
        crypto.randomBytes(len, function(err, salt){
            if (err) return fn(err);
            salt = salt.toString('base64');
            crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
                if (err) return fn(err);
                fn(null, salt, hash);
            });
        });
    }
};