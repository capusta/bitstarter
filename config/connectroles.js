/* configures our authorization module */


module.exports = function(user){

    /*anon users only have access to public page if they are not authenticated*/
    user.use(function(req, action){
        if (!req.isAuthenticated()){
        return action === 'access public page';
        }
    })

    user.use('access profile', function(req){
          console.log("access given req params are " + req.params)
          if (req.isAuthenticated()) { return true;}
    })

    user.use('access admin console','/admin', function(req){
        console.log("admin console permissions given");
        if (req.isAuthenticated() && (req.user.dataValues.usertype === 'admin')){
            return true;
        }
    })

    /* admins have access to the current request*/
    user.use(function(req){
        if (req.isAuthenticated() && (req.user.dataValues.usertype === 'admin')) {
            return true;
        }
    })

    user.setFailureHandler(function(req, res, action){
        console.log("failure occured")
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
