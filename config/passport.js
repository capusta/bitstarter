var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport) {

    passport.serializeUser(function(u, done) {
        done(null,  u.dataValues.username);
    });

    passport.deserializeUser(function(uname, done) {
        global.db.User.find({where: {username: uname}}).success(function(u) {
            if(u){
                done(null, u);
            } else{
                console.log("unable to desearlize user " + Date.now());
                done(true, null);
            }
        });
    });

    passport.use(new LocalStrategy(
    function(uname, pword, done) {
        global.db.User.find({where: {username: uname}}).success(function(user_instance) {
            //console.log(user_instance);
            if(user_instance){
                user_instance.validPassword(pword, function(isIT){
                    if (isIT == false) {
                        return done(null, false, { message: 'Incorrect password.'});
                    } else {
                        return done(null, user_instance);
                    }
                });
            } else {
                return done(null, false, { message: 'Incorrect username.'});
            }
        })
        }));
};