exports.isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()){
        next();
    }
    else {
        console.log("request not authenticated for " + req.url);
        req.flash('error');
        res.redirect("/login");
    }
}

exports.userExist = function(req, res, next) {
    global.db.User.count({where: {username: req.body.username}}).success(function(n) {
        if(n === 0) { next(0); }
        else {
            req.flash('error', "User exists");
            next(null);
        //res.redirect("/signup");
        }
    });
}