var crypto = require('crypto');

var password = process.env.AES_PASS;
console.log("starting encryption")
var m = crypto.createHash('md5');
m.update(password.toString());
var key = m.digest('hex');
m = crypto.createHash('md5');
m.update(password+key+(new Date()).getTime());
var iv = m.digest('hex');
var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

var encrypt = function(input){
    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv.slice(0,16));
    var encrypted = cipher.update(input,'utf8','binary');
    encrypted += cipher.final('binary');
    return new Buffer(encrypted, 'binary').toString('base64');
};

var decrypt = function(input) {
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv.slice(0,16));
    var decrypted = decipher.update(input,'base64','binary');
    decrypted += decipher.final('binary');
    return new Buffer(decrypted, 'binary').toString('utf8');
};

var generate = function(length) {
    length = length ? length : 32;
    var string = '';
    for (var i = 0; i < length; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        string += chars.substring(randomNumber, randomNumber + 1);
    }
    return string.toString('utf8');
};

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.generate = generate;