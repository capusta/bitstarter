module.exports = function(app, passport, usr){

    app.get('/admin', usr.can('access admin page'), function(req, res) {
        if(req.isAuthenticated()) {
            res.render('admin/cardmanage');
        } else {
            req.flash('error');
            res.render("login", {message: "Please Login"});
        };
    });
    app.post('/admin/addcard',  usr.can('access admin page'), function(req, res) {
        if(req.isAuthenticated()) {
            global.db.User.find( { where: {username: req.body.username}}).success(function(u){
                if(u == null) {
                    req.flash('info', 'Error - user not found')
                    res.redirect("admin")
                    return
                }
                var intRegex = /^\d+$/;
                if(!intRegex.test(req.body.cardAmount)) {
                    req.flash('info', 'lolz, you did not enter a number')
                    res.redirect("admin")
                    return
                }
                global.db.Moneycard.build({
                    cardID: req.body.cardID, type: req.body.cardType,
                    amount: req.body.cardAmount, condition: req.body.cardCondition})
                    .save().success(function(c){
                        u.addMoneycard(c);
                        global.db.Message.addCard(req.body.cardType, req.body.cardID, u);
                        console.log("Card " + c.cardID + " added to " + u.username);
                        req.flash('info', 'Yay, card added to ' + u.username)
                        res.redirect("admin");
                    })
            })

        } else {
            res.redirect("login")
        }
    })
    app.post('/admin/swapcard',  usr.can('access admin page'), function(req, res) {

        if(req.isAuthenticated()) {

            global.db.User.find( { where: {username: req.body.toUser}}).success(function(u_to){
                if(u_to == null) {
                    console.log("error - user TO not found")
                    req.flash('info','Nope - user TO not found')
                    res.redirect("admin")
                    return
                     }
                global.db.User.find( { where: {username: req.body.fromUser}}).success(function(u_from){
                    if(u_from == null) {
                        console.log("error - user FROM not found")
                        req.flash('info','Nope - user FROM not found')
                        res.redirect("admin")
                        return
                    }
                    global.db.Moneycard.find( { where: {
                                                cardID: req.body.cardID }}).success(function(c){
                            if (c == null){
                                console.log("error - looking for a card but got null")
                                req.flash('info','Nope - card is not found')
                                res.redirect("admin")
                                return
                                }
                            u_from.removeMoneycard(c).success(function() {
                                u_to.addMoneycard(c).success(function(){
                                    global.db.Message.addCard(c.type, c.cardID, u_to);
                                    console.log("card changed hands from " + u_from.username + " to " + u_to.username);
                                    req.flash('info','Card Swapped') ;
                                    res.redirect("admin")
                                    return
                                });
                            })

                    })
                })
            })

        } else {
            res.redirect("login")
        }
    })
}
