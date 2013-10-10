var Auth = require('../config/authorization.js'),
    url     = require('url');

module.exports =    global.https   = require('https'),
                    global.async   = require('async');

module.exports = function(app, passport, usr){

    require('./money.js')(app, passport, usr);
    require('./cards.js')(app, passport, usr);
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
            var cards_json = [];
            var messeges_json = [];
            global.db.User.find( { where: {username: req.user.username}}).success(function(u){
                u.getMoneycards().success(function(cards){
                    cards.forEach(function(c){
                        cards_json.push({cid: c.cardID, ct: c.type})
                    })
                    u.getMesseges().success(function(messeges){
                         messeges.forEach(function(c){
                             messeges_json.push({time: c.time, from: c.from, message: c.message})
                         })
                        res.render("userhome", { user : req.user, cards : cards_json, messeges: messeges_json, message: req.flash('info')})
                    })
                })
            })

        } else {
            res.redirect("login")
        }
    });

    app.get('/settings', function(req, res) {
        if(req.isAuthenticated()) {
            res.render("updateprofile", { user : req.user})
        } else {
            res.redirect("login");
        }
    })

    app.post('/settings', function(req, res) {
        if(req.isAuthenticated()) {

            global.db.User.find( { where: {username: req.user.username}}).success(function(u){
                u.name = req.body.nameUpdate;
                u.email = req.body.emailUpdate;
                u.addressOne = req.body.addrOneUpdate;
                u.addressTwo = req.body.addrTwoUpdate;
                u.homeBTC = req.body.homeBTCUpdate;
                u.save().success(function() {
                    global.db.Message.sendMessege("admin",u.username,"Profile Updated",function(isOK){
                        if(isOK){
                            req.flash('info','profile updated')
                            res.redirect("userhome")
                            console.log(u.username + " " + u.dataValues.username)
                        }})})})
        } else {
            res.redirect("login")
        }
    })

    app.post('/settings/sendmessege', function(req, res){
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

    app.post('/login',
        passport.authenticate('local', {
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
                global.db.User.signup(req.body.username.toLowerCase().trim(), req.body.password, function(err, user){
                    if(err) throw err;
                    global.db.Message.create({to: user.username, from: "admin", message: "Welcome to Suimo! "})
                        .success(function(m){
                            user.addMessege(m);
                        });
                    req.login(user, function(err){
                        if(err) return next(err);
                        res.redirect("/settings");
                    });
                    console.log(req.body.username + " signed up")
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