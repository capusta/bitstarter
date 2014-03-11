fs      = require('fs'),
    b64 = require('../base64url'),
    email = require("../../node_modules/emailjs/email"),
    path = require('path'),
    templateDir = path.join(__dirname, '../../templates'),
    emailTemplates = require("email-templates");

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
}
module.exports = function(socket, user){

    socket.on('send verification email',function(){
        //TODO: keep a verified email field and check against that.  resetting the email doe snot keep the verification status
        if (tooManyEmails(user)){  return; }
        user.oneTimeSecret = 'verify_email';
        user.emailCount = user.emailCount+1;
        user.save().success(function(){
            locals = {username: user.username, code: b64.urlEncode(user.oneTimeSecret)};
            emailTemplates(templateDir, function(err, template){
                template('new_user', locals, function(err, html, text){
                if (err) {
                    console.log("error in making the new user template " + err.message);
                } else {
                    server.send({
                        from: "Suimo <info@suimo.pw>",
                        to: user.name+"<"+ user.email + ">",
                        subject: "SuiMo - Email Confirmation",
                        attachment:
                            [
                                {data: html, alternative: true}
                            ]
                    }, function(err, message) {
                        if(message) { console.log("new user " + user.username + " messege sent"); }
                        else {console.log("error in sending email for new user template")}
                    });
                }});
            //remember to convert to url save base 64
            });
        });
    });

    socket.on('send user delete request', function(){
        user.oneTimeSecret = 'delete_user';
        user.save().success(function(){
            locals = {username: user.username, code: b64.urlEncode(user.oneTimeSecret)};
            emailTemplates(templateDir, function(err, template){
                template('delete_user_notify', locals, function(err, html, text){
                    if (err) {
                        console.log("error in making the new user template " + err.message);
                    } else {
                        server.send({
                            from: "Suimo <info@suimo.pw>",
                            to: user.name+"<"+ user.email + ">",
                            subject: "SuiMo - Delete Account Request",
                            attachment:
                                [
                                    {data: html, alternative: true}
                                ]
                        }, function(err, message) {
                            if(message) { console.log("user " + user.username + " delete account messege sent"); }
                            else {console.log("socket email.js - error in sending email for user deletion template")}
                        });
                    }});
                //remember to convert to url save base 64
            });

        })

    })
}
