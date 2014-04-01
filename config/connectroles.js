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
};
