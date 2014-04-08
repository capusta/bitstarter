module.exports = function(app, passport){

    var checkBlockChain = function(u, hash){
        homeBTC = u.homeBTC;

        https.get("https://blockchain.info/rawtx/"+hash+"?format=json", function(rr) {
            var body = '';
            rr.on('data', function(chunk) {body += chunk;});
            rr.on('end', function() {
                try {
                    var x = JSON.parse(body);
                    for (var i in x.inputs) {
                        if (homeBTC === x.inputs[i].prev_out.addr) {
                            //NOTE: Must never set payment BTC any other way ... only when an order that comes in
                            //Otherwise ask users for verification by 1st - setting their address, then
                            //2nd - buying a verification.
                            u.paymentBTC = x.inputs[i].prev_out.addr;
                            u.stepNumber = u.stepNumber.concat('c');

                            u.BTCverified = 'TRUE';
                            u.save().success(function(u){
                                console.log(u.username + " verified")
                            });
                            break;
                        }
                    }
                    //We are going to save the hash of the transaction and run it later
                    if(!u.BTCverified){
                        u.paymentBTC = hash;
                        u.save();
                    }
                }
                catch (err){
                    console.log("unable to parse blockchain hash: " + err);
                    console.log("specifically, hash " + hash);
                    u.paymentBTC = hash;
                    u.save();
                    //TODO: RUN SOMETHING LATER TO VERIFY THE ACCOUNT ONCE THE HASH IS ON THE BLOCKCHAIN
                }
            }
            )});
    }

    app.post('/paymentcomplete?', function(req, res) {
        if (process.env.PAYMENT_COMPLETE_SECRET !== req.param('secret')) {
            console.log("incorrect secret key from " + req.connection.remoteAddress)
                res.status(418).send()
            return;
        } else {
            var b = req.body;
            try {
                if (b.order.status != "completed") {
                    console.log("Order " + b.order.id + " status is not completed ");
                    res.status(418).send();
                    return;
                }
                var p = global.db.Payment;
                //we now have a completed payment for a user, lets start building the payment first
                //populate with basic information before we check the user.
                var modifiedAmount = 0;
                if (b.order.button.name === 'Verification') {
                    modifiedAmount = b.order.total_native.cents;
                } else {
                    modifiedAmount = b.order.total_native.cents - 500;
                }
                var new_payment_instance = p.build({
                    time: b.order.created_at,
                    username: b.order.custom,
                    payment_ID: b.order.id,
                    amount: modifiedAmount,
                    productName: b.order.button.name
                });
                //instance is built but not saved yet.  Lets find the user it belongs to.
                global.db.User.find( { where: { username: b.order.custom}})
                    .success(function(u){
                        if (u != null) {
                            //legitimate transaction for a non null user - this is a good thing
                            //lets first generate all the prev_out for bitcoin transaction
                            var hsh = b.order.transaction.hash;
                            // we will let this catch up to our database later, lets press on
                            checkBlockChain(u, hsh);
                            new_payment_instance.save().success(function(i) {

                                u.addPayment(i);
                                console.log("instance " + i.payment_ID + " saved for user " + u.username);
                                u.stepNumber = u.stepNumber.concat('d');
                                global.db.Message.sendMessege("admin", u.username,
                                    "Order " + i.payment_ID + " for " + i.productName + " Received",function(status){});
                                u.save();
                                res.status(200).send("done");
                            }).error(function(err) {
                                    console.log("instance not saved for some reason");
                                    res.status(418).send();
                                    return;
                                });
                        } else {
                            console.log("Found NULL user for order " + b.order.id);
                            console.log("Order username was " + b.order.custom)
                            //save the transaction, even though it has no users attached to it.
                            new_payment_instance.save();
                            res.status(200).send();
                            return;
                        }})
                    .error(function(err){
                        console.log("Error in finding a user for payment " + b.order.id);
                        new_payment_instance.save();
                        res.status(200).send();
                        return;
                    })
            }
            catch(err) {
                console.log("general error occured.  unable to parse the whole payment")
                console.log("error is " + err.message)
                //set a general time out to obfuscate any errors
                setTimeout(function(){
                    res.status(418).send()}, 2000);
            }}
        }
    );

}
