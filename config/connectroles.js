/* configures our authorization module */


module.exports = function(user){

    /*anon users only have access to public page if they are not authenticated*/
    user.use(function(req, action){
       /* if (!req.isAuthenticated()){
            console.log("request not authenticated")
        return action === 'access public page';
        }*/
    })

    user.use('access profile', function(req){
          if (req.isAuthenticated()) { return true;}
    })

    user.use('access admin page','/admin', function(req){
        console.log("admin console permissions given");
        return (req.isAuthenticated() && (req.user.dataValues.usertype === 'admin'));
    })

    /* admins have access to the current request*/
    user.use(function(req){
        if (req.isAuthenticated() && (req.user.dataValues.usertype === 'admin')) {
            return true;
        }
    })

    user.setFailureHandler(function(req, res, action){
        console.log("connect roles failure:  " + action)
        var accept = req.headers.accept || '';
        //res.status(403);
        if (~accept.indexOf('html')) {
            res.redirect("login");
            //res.send('access-denied (but can be rendered)', {action: action})
        } else {
            res.send("Access Denied - you do not have permission to: " + action);
        }
    });
}
