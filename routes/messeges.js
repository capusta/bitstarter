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
    })
}
