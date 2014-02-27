fs      = require('fs'),
    b64 = require('../config/base64url'),
    email = require("../node_modules/emailjs/email"),
    path = require('path'),
    templateDir = path.join(__dirname, '../templates'),
    emailTemplates = require("email-templates");

var server = email.server.connect({
    user: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    ssl: true});

module.exports = function(app, passport, usr){

    app.post('/admin/sendmessege', usr.can('access admin page'), function(req, res){
        if(req.isAuthenticated()) {
            global.db.Message.sendMessege(req.body.fromUser, req.body.toUser, req.body.m, function(isOK){
                if(isOK) {
                    req.flash('info','messege sent')
                    res.redirect("admin")
                } else {
                    req.flash('info','user not found')
                    res.redirect('admin')
                }
            });
         } else {
            res.redirect("login")
        }
    });

    app.get('/secret/:id', function(req, res){
        global.db.User.find( { where: {oneTimeSecret: b64.urlDecode(req.params.id)}}).success(function(u){
            if(u == null){
                console.log("got a secret messege but could not  find the user");
                if(req.isAuthenticated()){
                    res.write('Invalid Code');
                    res.end();
                    return;
                } else {
                    req.flash('error','Incorrect Code - please check again');
                    res.redirect("login");
                    return;
                }
            }
            u.getSecretAction(function(err, actn){
                //this is a model instance method that will decode the one time encrypted action
                if(!err){
                    command = actn.toString('utf8').slice(5,actn.length-5).split(",")[0];
                    console.log('command is ' + command)
                    if (command === 'new_email'){
                        u.emailVerified = 'TRUE';
                        u.removeOneTimeSecret(function(err){
                            if(err){console.log('unable to remove onetimeSecret')}
                        })
                        u.save();
                        req.flash('error','Email Verified, Please Log In')
                        res.redirect("login")
                        return;
                    };
                    if (command === 'resetpassword'){
                        u.resetpassword(function(p){
                            if(p){
                                locals = {username: u.username, pass: p};
                                emailTemplates(templateDir, function(err, template){
                                    template('pass_reset', locals, function(err, html, text){
                                        if (err) {
                                            console.log("error in making the reset password template " + err.message);
                                        } else {
                                            server.send({
                                                from: "Suimo <info@suimo.pw>",
                                                to: u.name+"<"+ u.email + ">",
                                                subject: "SuiMo - Password Reset",
                                                attachment:
                                                    [
                                                        {data: html, alternative: true}
                                                    ]
                                            }, function(err, message) {
                                                if(message) { console.log("new user " + u.username + " messege sent"); }
                                                else {console.log("messeges.js - error in sending email for new user template")}
                                            });
                                        }});
                                });
                                u.removeOneTimeSecret(function(err){})
                                req.flash('error','Please check your email for your new password.');
                                res.redirect("login");
                            }
                            else {
                                console.log('messeges.js - error setting new password')
                            }
                        })
                    }
                } else{
                   console.log('unable to get secret action for user ' + u.username)
                   console.log(err.message)
                }})
            }).error(function(e){
                console.log('got sercret messege error on finding user from database');
            })
        //res.redirect("login");
        });
}
