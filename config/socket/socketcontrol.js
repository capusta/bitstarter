ejs = require('ejs')
    , fs = require('fs')
    , rest = require('restler');

module.exports = function(socket, user){

    socket.on('changeUserData', function(data){
        user.stepNumber = user.stepNumber.concat('a');
        switch(data.item){
           case 'name':
               user.name = data.value;
               user.save()
                   .error(function(err){ socket.emit('displayerror', "Error Saving Name")})
                   .success(function(){
                       console.log('new name sucessfully saved');
                       socket.emit('changeOK')});
               break;
            case 'password':
                user.changepassword(data.value.toString(), function(isOK){
                    if(isOK){
                        console.log('socketcontrol.js - new password sucessfully saved');
                        socket.emit('changeOK');
                        socket.emit('displayerror', 'Password Changed');
                    }
                    else{
                        console.log('socketcontrol.js - error changing password for ' + user.username);
                        socket.emit('displayerror', 'Unable to Change password');
                    }
                });
                    break;

           case 'email':
               user.email = data.value;
               user.save()
                   .error(function(err){ socket.emit('displayerror', 'Invalid email')})
                   .success(function(){ socket.emit('changeOK')})
               break;
           case 'addressOne':
               user.addressOne = data.value;
               user.save()
                   .error(function(err){ socket.emit('displayerror', 'Invalid address - seems to be too long')})
                   .success(function(){ socket.emit('changeOK')});
               break;
           case 'addressTwo':
               user.addressTwo = data.value;
               user.save()
                   .error(function(err){
                       socket.emit('displayerror', "Unable to save Address")
                       console.log('socket.js - error saving ' + data.item + " error: " + err);
                   })
                   .success(function(){ socket.emit('changeOK')});
               break;
           case 'bitmessege':
               user.bitMessegeAddr = data.value;
               user.save()
                   .success(function() { socket.emit('changeOK')})
                   .error(function(err){ socket.emit('displayerror', "Please make sure it is 4-20 characters")})
               break;
           case 'btcAddress':
               user.homeBTC = data.value;
               user.save()
                   .error(function(err) {
                       socket.emit('displayerror', 'Invalid Bitcoin Address');
                   })
                   .success(function(){ socket.emit('changeOK')});
               break;
           case 'finished':
               //sendMessege ( from to callback)
               global.db.Message.sendMessege("admin",user.username,"Profile Successfully Updated",function(isOK){
                   if(isOK){} else {
                       socket.emit('displayerror', 'Error - unable to send messege.  Should probably notify side Admin')}});
               user.save()
                   .success(function() {
                       socket.emit('push_dashboard');
                       socket.emit('new mail');
                   })
                   .error(function(err){
                       socket.emit('displayerror', 'Error - unable to save details.  Should probably notify side Admin');
                       console.log('socket.js - error saving ' + data.item + " error: " + err);
                   });
               break;
           default:
               socket.emit('displayerror', 'Unable to Change the ' + data.item);
       }
    });
    // ---- returns all the Suica and Passmo cards a user has ----
    socket.on('get_mycards', function(){
    var path = "./views/partials/moneycards.ejs";
    var cards_json = [];
        user.getMoneycards().success(function(cards){
            cards.forEach(function(c){
                cards_json.push({cid: c.cardID, ct: c.type, cm: c.condition, amt: c.amount})
            });
            console.log('emitting moneycards for ' + user.username);
            socket.emit('render', {data: ejs.render(fs.readFileSync(path).toString(), {cards: cards_json})});
        });
});
    // ---- returns all  orders made ----
    socket.on('get_orders', function(){
    var path = "./views/partials/orders.ejs";
    var payments_json = [];
    user.getPayments().success(function(payments){
        payments.forEach(function(p){
            payments_json.push({pid: p.payment_ID, amount: p.amount, pname: p.productName,
                refundstatus: p.refundstatus, refundedAmount: p.refundedAmount});
        })
        socket.emit('render', {data: ejs.render(fs.readFileSync(path).toString(), {orders: payments_json})})
})
} );
    socket.on('get_profile', function(){
        var path = "./views/partials/myprofile.ejs";
        var html = ejs.render(fs.readFileSync(path).toString(), {user: user});
        socket.emit('render', {data: html});
    });

    socket.on('delete message', function(msgID){
        user.getMesseges({ where: {id: msgID.id }}).success(function(msg){
            if (msg != null) {
                try {
                    msg[0].destroy();
                } catch (e){
                    socket.emit('displayerror', "Unable to Delete Message")
                }
            }
            socket.emit('repeat', 'get_messeges');
        })
    });

    socket.on('send_message', function(data){
        var con = data.content.toString();
        if (data.content != null & con.length >= 255) {
            socket.emit('displayerror', "Message too long");
            return;
        }
        try {
            global.db.Message.sendMessege(data.from, 'admin', con,
                function(isOK){
                    if(!isOK){
                        socket.emit('displayerror', "Unable to send message securely.  Please contact site admin by other means");
                        return;
                    } else {
                        socket.emit('displayerror', 'Messege Sent')
                    }
                }
            );
            global.db.Message.sendMessege('admin', data.from, 'Thank you, your messege has been received.',
                function(isOK){
                    if(!isOK){
                        socket.emit('displayerror', "Unable to send message securely.  Please contact site admin by other means");
                        return;
                    }
                });
            socket.emit("repeat", "get_messeges");
            socket.emit('displayerror', 'Messege Sent')
            }
        catch(e){
            console.log('error sending messeges ' + e)
            socket.emit('displayerror', "Unable to send message securely.  Please contact site admin by other means");
        }
    });

    socket.on('get_messeges', function(){
    var path = "./views/partials/messeges.ejs";
    var messeges_json = [];
            user.getMesseges().success(function(messeges){
                messeges.forEach(function(c){
                    messeges_json.push({time: c.time, from: c.from, message: c.message, id: c.id})
                });
                socket.emit('render', {data: ejs.render(fs.readFileSync(path).toString(),
                    {messeges: messeges_json
                    , user: user})});
            })
    });

    socket.on('checkStepA', function(){
        function noDups( s ) {
            var chars = {}, rv = '';
            for (var i = 0; i < s.length; ++i) {
                if (!(s[i] in chars)) {
                    chars[s[i]] = 1;
                    rv += s[i];
                }
            }
            return rv;
        }
        user.stepNumber = noDups(user.stepNumber);
        user.alert = noDups(user.alert);
        user.save();
    });
    socket.on('checkStepB', function(){
     user.stepNumber = user.stepNumber.concat('b');
        user.save().success(function(){
            socket.emit('push_dashboard');
        })
    });
    socket.on('checkStepC', function(){
        user.stepNumber = user.stepNumber.concat('c');
        user.save().success(function(){
            socket.emit('push_dashboard');
        })
    });
    socket.on('checkStepD', function(){
        user.getPayments().success(function(payments){
            if(payments && payments.length > 0){
                user.stepNumber = user.stepNumber.concat('d');
                user.save().success(function(){
                    socket.emit('push_dashboard');
                });
            } else {
                socket.emit('no_payments')
            }
        })
    });
    socket.on('checkStepE', function(){
        user.stepNumber = user.stepNumber.concat('e');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    });
    socket.on('checkStepF', function(){
        user.stepNumber = user.stepNumber.concat('f');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    });
    socket.on('checkStepG', function(){
        user.stepNumber = user.stepNumber.concat('g');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    });
    socket.on('clear_checklist', function(){
        user.stepNumber = "0";
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    });
    socket.on('get_data', function(){
    var path = "./views/partials/home.ejs";
    var chartdata = [] ;
    var step_a = false, step_b = false, step_c = false, step_d = false, step_e = false, step_f = false, step_g = false;
    var bad =   {
        value : 13,
        color : "#EA9681"
    };
    var good = {
        value : 13,
        color : "#6ED663"
    }

            //wow we need to reduce all that code
    if (~user.dataValues.stepNumber.indexOf('a')){
        chartdata.push(good);
        step_a = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('b')){
        chartdata.push(good);
        step_b = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('c')){
        chartdata.push(good);
        step_c = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('d')){
        chartdata.push(good);
        step_d = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('e')){
        chartdata.push(good);
        step_e = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('f')){
        chartdata.push(good);
        step_f = true;
    } else {chartdata.push(bad)}
    if (~user.dataValues.stepNumber.indexOf('g')){
        chartdata.push(good);
        step_g = true;
    } else {chartdata.push(bad)}
    socket.emit('render', {data: ejs.render(fs.readFileSync(path).toString(),
        {chart: chartdata, step_a: step_a, step_b: step_b, step_c: step_c, step_d: step_d, step_e: step_e, step_f: step_f,
            step_g: step_g})})
})
}

