ejs = require('ejs'), fs = require('fs');

module.exports = function(socket, user){
    if(user.usertype !== 'admin'){ console.log('oops, unauthorized access '); return;}
    console.log('starting admin module');

    socket.on('adminrequest all', function(data){
        if (data === 'users'){
            var upath = './views/admin/_allusers.ejs';
            var users_json = [];
            global.db.User.findAll().success(function(usrs){
                async.forEach(usrs, function(u, callback){
                    users_json.push({id: u.id, username: u.username, type: u.usertype, email: u.emailVerified, btc: u.BTCverified });
                    callback();
                });
                socket.emit('adminrender', {html: ejs.render(fs.readFileSync(upath).toString(), {users: users_json})});
            });
        }
        if (data === 'cards'){
            var cpath = './views/admin/_allcards.ejs';
            var cards_json = [];
            global.db.Moneycard.findAll().success(function(cards){
                async.forEach(cards, function(c, callback){
                    cards_json.push({id: c.cardID, lr: c.cardLR, type: c.type, amount: c.amount, isArchived: c.archived});
                    callback();
                });
                socket.emit('adminrender', {html: ejs.render(fs.readFileSync(cpath).toString(), {cards: cards_json})});
            })

        }
        if (data === 'payments'){
            var p_path = './views/admin/_allpayments.ejs';
            var payments_json = [];
            global.db.Payment.findAll().success(function(pyments){
                if (pyments == null){ socket.emit('adminalert', "No Payments found for some reason")};
                async.forEach(pyments, function(p, callback){
                    payments_json.push({time: p.time, username: p.username, ID: p.payment_ID, amount: p.amount, rfstatus: p.refundstatus});
                    callback();
                });
                socket.emit('adminrender', {html: ejs.render(fs.readFileSync(p_path).toString(), {payments: payments_json})});
            });
        };
    });

    socket.on('adminrequest card', function(cardID){
        var cpath = './views/admin/_bycard.ejs', info_json = [];
        global.db.Moneycard.find({ where: {cardID: cardID.ul, cardLR: cardID.lr}, include: [global.db.User]}).success(function(card){
            if(card == null) {
                console.log('error, card ' + JSON.stringify(cardID) + " requested but not found ");
                socket.emit('adminalert', "card " + JSON.stringify(cardID) + " not found");
                return;
            }
            info_json.push({cardType: card.type, cardAmount: card.amount, archived: card.archived,
                UL: card.cardID, LR: card.cardLR, condition:card.condition, username: card.user.username });
            socket.emit('adminrender', {html: ejs.render(fs.readFileSync(cpath).toString(), {info: info_json[0]})});
        })
    });

    socket.on('adminrequest user', function(uname){
        if(uname == null){ socket.emit('adminalert', "Empty Username"); return;};
        //going to get the user and all of his/her associated values (eager loading)
        global.db.User.find({ where: {username: uname}, include: [ global.db.Payment, global.db.Moneycard ]}).success(function(usr){
            if(usr == null) {
                console.log('error finding requested user ' + uname);
                socket.emit('adminalert', "Unable to find the user");
                return;
            };
            var upath = './views/admin/_byuser.ejs';
            socket.emit('adminrender', {html: ejs.render(fs.readFileSync(upath).toString(), {user: usr})});
        })
    })

    socket.on('adminrequest changepassword', function(data){
        global.db.User.find( { where: { username: data.username}}).success(function(u){
            if(u==null) {
                socket.emit('adminalert', "unable to find user");
                return;
            }
            u.changepassword(data.newpass, function(isOK){
                if(isOK) { socket.emit('adminalert', "password changed"); }
                else { socket.emit('adminalert', "unable to change password for user"); }
            });
        });
    });
};
