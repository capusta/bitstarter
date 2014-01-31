var crypto = require('crypto');

var password = process.env.AES_PASS;
console.log("starting encryption")
var m = crypto.createHash('md5');
m.update(password);
var key = m.digest('hex');
m = crypto.createHash('md5');
m.update(password+key);
var iv = m.digest('hex');


var encrypt = function(input){
    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv.slice(0,16));
    var encrypted = cipher.update(input,'utf8','binary');
    encrypted += cipher.final('binary');
    var a = new Buffer(encrypted, 'binary').toString('base64');
    return a;
};

var decrypt = function(input) {
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv.slice(0,16));
    var decrypted = decipher.update(input,'base64','binary');
    decrypted += decipher.final('binary');
    var a = new Buffer(decrypted, 'binary').toString('utf8');
    return a;
};

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;