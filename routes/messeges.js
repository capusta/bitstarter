module.exports = function(app, passport, usr){

    app.post('/admin/sendmessege', usr.can('access admin page'), function(req, res){
        if(req.isAuthenticated()) {
            global.db.Message.sendMessege(req.body.fromUser, req.body.toUser, req.body.m);
         res.redirect("userhome")} else {
            res.redirect("login")
        }
    })
}
