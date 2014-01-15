module.exports = function(app, passport, usr){

    app.get('/orders', function(request, response) {
        global.db.Order.findAll().success(function(orders) {
            var orders_json = [];
            //console.log(orders);
            orders.forEach(function(order) {
                orders_json.push({id: order.coinbase_id, amount: order.amount, time: order.time});
            });
            // Uses views/orders.ejs
            response.render("orders", {orders: orders_json, user: request.user});
        }).error(function(err) {
                console.log(err);
                response.send("error retrieving orders");
            });
    });

    var checkBlockChain = function(u, hash){
        var paymentBTC = u.paymentBTC;
        var submittedBTC = u.homeBTC;
        if (paymentBTC === submittedBTC){
            console.log("The user is already verified");
            u.stepNumber = u.stepNumber.concat('c');
            u.save();
            return;
        }
        console.log("user is not verified")
        console.log("processing hash " + hash)
        https.get("https://blockchain.info/rawtx/"+hash+"?format=json", function(rr) {
            var body = '';
            rr.on('data', function(chunk) {body += chunk;});
            rr.on('end', function() {
                try {
                    var x = JSON.parse(body);
                    for (var i in x.inputs) {
                        if (submittedBTC === x.inputs[i].prev_out.addr) {
                            u.paymentBTC = x.inputs[i].prev_out.addr;
                            u.save();
                            break;
                        };
                    }
                }
                catch (err){
                    console.log("unable to parse blockchain hash");
                    console.log("specifically, hash " + hash + " for order ")
                }
            })});
    }

    app.post('/paymentcomplete?', function(req, res) {
        if (process.env.PAYMENT_COMPLETE_SECRET !== req.param('secret')) {
            console.log("incorrect secret key from " + req.connection.remoteAddress)
                res.status(418).send()
            return;
        } else {
            var b = req.body;
            try {
                console.log("parsing payment " + b.order.status);
                if (b.order.status != "completed") {
                    console.log("status is not completed ");
                    res.status(418).send()}
                var p = global.db.Payment;
                //we now have a completed payment for a user, lets start building the payment first
                //populate with basic information before we check the user.
                var new_payment_instance = p.build({
                    time: b.order.created_at,
                    username: b.order.custom,
                    payment_ID: b.order.id,
                    amount: b.order.total_native.cents,
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
                            console.log("Successfully found user BUT - but for transaction " + b.order.id);
                            console.log("order username was " + b.order.custom)
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

    app.get('/refresh_orders', function(request, response) {
        https.get("https://coinbase.com/api/v1/orders?api_key=" + process.env.COINBASE_API_KEY, function(res) {
            var body = '';
            res.on('data', function(chunk) {body += chunk;});
            res.on('end', function() {
                //console.log(body);
                try {
                    var orders_json = JSON.parse(body);
                    if (orders_json.error) {
                        response.send(orders_json.error);
                        return;
                    }
                    // add each order asynchronously
                    async.forEach(orders_json.orders, addOrder, function(err) {
                        if (err) {
                            console.log(err);
                            response.send("error adding orders");
                        } else {
                            // orders added successfully
                            response.redirect("/orders");
                        }
                    });
                } catch (error) {
                    console.log(error);
                    response.send("error parsing json");
                }
            });

            res.on('error', function(e) {
                console.log(e);
                response.send("error syncing orders");
            });
        });
    });

    var addOrder = function(order_obj, callback) {
        var order = order_obj.order; // order json from coinbase
        if (order.status != "completed") {
            // only add completed orders
            callback();
        } else {
            var Order = global.db.Order;
            // find if order has already been added to our database
            Order.find({where: {coinbase_id: order.id}}).success(function(order_instance) {
                if (order_instance) {
                    // order already exists, do nothing
                    callback();
                } else {
                    // build instance and save

                    var new_order_instance = Order.build({
                        coinbase_id: order.id,
                        amount: order.total_btc.cents / 100000000, // convert satoshis to BTC
                        time: order.created_at
                    });
                    new_order_instance.save().success(function() {
                        callback();
                    }).error(function(err) {
                            callback(err);
                        });
                }
            });
        }
    };

}
