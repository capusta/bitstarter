var Auth = require('../config/authorization.js'),
    url     = require('url');

module.exports =    global.https   = require('https'),
                    global.async   = require('async');

module.exports = function(app, passport, usr){

    require('./money.js')(app, passport);
    require('./admin.js')(app, passport, usr);
    require('./messeges.js')(app, passport, usr);

    app.get('/', function(req, res) {
        res.render("_index", {user: req.user});
    });

    app.get('/info', function(req, res){
        res.render("info", {user: req.user});
    });

    app.get('/signup', function(req, res) {
        res.locals.oldname = req.body.username || "";
        res.render('signup', {message: req.flash('error'), user: req.user});
    });

    app.get('/userhome', usr.can('access profile'), function(req, res) {
        if(req.isAuthenticated()){

            res.render("userhome", { message: req.flash('info'), user: req.user})
        } else {

            res.redirect("login")
        }
    });

    app.get('/settings', usr.can('access profile'), function(req, res) {
        if(req.isAuthenticated()) {
            try { res.render("updateprofile", { user : req.user, message: req.flash('info')}) }
            catch (err) {
                console.log("unable to render update profile screen")
                res.redirect("login")
            }
        } else {
            res.redirect("login");
        }
    })

    app.post('/settings', usr.can('access profile'), function(req, res) {
        if(req.isAuthenticated()) {

            global.db.User.find( { where: {username: req.user.username}})
                .success(function(u){
                    var cache_email = u.email;
                    var cache_homeBTC = u.homeBTC;
                u.name = req.body.nameUpdate;
                u.addressOne = req.body.addrOneUpdate;
                u.addressTwo = req.body.addrTwoUpdate;
                    if(req.body.homeBTCUpdate != null){
                        u.homeBTC = req.body.homeBTCUpdate.trim();
                    } else {
                        u.homeBTC = req.body.homeBTCUpdate;
                    }
                if (cache_email != req.body.emailUpdate){
                    u.email = req.body.emailUpdate;
                    u.emailVerified = 'FALSE';
                }
                u.stepNumber = u.stepNumber.concat('a');
                u.bitMessegeAddr = req.body.bitmessege;
                u.usertype = 'user';
                u.save()
                    .success(function() {
                    global.db.Message.sendMessege("admin",u.username,"Profile Updated",function(isOK){
                        if(isOK){
                            res.redirect("userhome")
                        }})})
                    .error(function(err){
                        if(err.email){
                            req.flash('info',err.email[0]);res.redirect("settings"); return;}
                        if(err.homeBTC){
                            req.flash('info',err.homeBTC[0]);res.redirect("settings"); return;}
                        req.flash('info', 'oops error occured');
                        res.redirect("settings")
                    }
                )
                }
            )
                .error(function(err){
                    req.flash('info', 'user not found')
                    res.redirect("settings")
                })
        } else {
            res.redirect("login")
        }
    })

    app.post('/settings/sendmessege', usr.can('access profile'), function(req, res){
        if(req.isAuthenticated()){
            global.db.User.find( { where: {username: req.user.username}}).success(function(u){
                global.db.Message.sendMessege(u.username, 'admin', req.body.messegeToAdmin,
                    function(isOK){
                        if(isOK){req.flash('info','messege sent')}
                    });
                global.db.Message.sendMessege('admin', u.username, 'Thank you, your messege has been received.', function(isOK){})
                res.redirect("userhome")
            })
        } else {
            res.redirect("login")
        }
    })

    app.get('/login', function(req, res) {
        if (req.isAuthenticated()){
            res.redirect("userhome")

        } else {
            res.render("login", {message: req.flash('error')});
        }

    });

    app.post('/login',passport.authenticate('local', {
            successRedirect: '/userhome',
            failureRedirect: '/login',
            failureFlash: true
        }));

    app.post("/signup", function (req, res, next) {
        Auth.userExist(req, res, function(n){
            if(n == null) {
                console.log("user already exists " + n);
                res.locals.oldname = req.body.username || "user";
                res.render("signup", {message: req.flash('error')});
            } else {
                if(req.body.password1 !== req.body.password2){
                    console.log("passwords do not match");
                    req.flash('error', "Passwords does not match");
                    res.redirect("signup")
                    return;
                }
                global.db.User.signup(req.body.username.toLowerCase().trim(), req.body.password1, function(err, user){
                    if(err) {
                        console.log("got errors on signup " + err)
                        req.flash('error', "Username must be alphanumeric, " + err.message)
                        res.redirect("signup")
                        return
                    };
                    if(user){
                    global.db.Message.create({to: user.username, from: "admin", message: "Welcome to Suimo! "})
                        .success(function(m){
                            user.addMessege(m);
                        });
                    req.login(user, function(err){
                        if(err) {
                            return next(err); }
                        else {
                            res.redirect("login");
                        }
                    })};

                });
            }
        });
    });

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
    });

    app.get('/faq', function(req, res){
          res.render("faq");
    })
}