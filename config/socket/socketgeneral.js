ejs = require('ejs')
    , fs      = require('fs')
    , validator = require('validator')
    , b64 = require('../base64url')
    , email = require("../../node_modules/emailjs/email")
    , path = require('path')
    , templateDir = path.join(__dirname, '../../templates')
    , emailTemplates = require("email-templates");

var server = email.server.connect({
    user: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    ssl: true});

var tooManyEmails = function(user){
    if (user.emailCount > 10) {
        console.log(user.username + " sending too many emails");
        global.db.Message.sendMessege("admin",user.username,"Too many email verifications, please take a break",function(isOK){});
        return true;
    } else { return false;}
};

module.exports = function(socket){

socket.on('request password reset', function(username){
    console.log('Password Reset for ' + username)

global.db.User.find({ where: { username: username}}).success(function(user){
    if(user == null){
    //probably a misspelled email account
    socket.emit('login_msg', {msg: 'Username not Found'});
    return;
    }
    user.oneTimeSecret = 'resetpassword';
    user.save().success(function(){
        locals = {username: user.username, code: b64.urlEncode(user.oneTimeSecret)};
        emailTemplates(templateDir, function(err, template){
            template('pass_reset_notify', locals, function(err, html, text){
                if (err) {
                    console.log("error in making the new user template " + err.message);
                } else {
                    server.send({
                        from: "Suimo <info@suimo.pw>",
                        to: user.name+"<"+ user.email + ">",
                        subject: "SuiMo - Password Reset Request",
                        attachment:
                            [
                                {data: html, alternative: true}
                            ]
                    }, function(err, message) {
                        if(message) { console.log("new user " + user.username + " password reset sent"); }
                        else {console.log("error in sending email for password reset template")}
                    });
                }});
        });
    })
});
});


socket.on('check_username', function(data){
        var n = 0;
    global.db.User.findAndCountAll( { where: {username: data.username.trim().toLowerCase()}}).success(function(result){
        n = result.count;
        if (n != 0){
            socket.emit('username_bad');
        } else { socket.emit('username_good')}
    })
});

}
