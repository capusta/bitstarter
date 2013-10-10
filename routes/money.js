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

    app.post('/paymentcomplete?', function(req, res) {
        if (process.env.PAYMENT_COMPLETE_SECRET != req.param('secret')) {
                res.status(403).send("bad kitty")
        } else {
            var b = req.body;
            console.log("parsing paymebnt " + b.order.status);
            if (b.order.status != "completed") {
                    console.log("status is not completed ");
                    res.status(403).send("bad kitty")}
            var p = global.db.Payment;
            try {
                var new_payment_instance = p.build({
                    time: b.order.created_at,
                    username: b.order.custom,
                    payment_ID: b.order.id,
                    amount: b.order.total_native.cents,
                    productName: b.order.button.name
                });
                new_payment_instance.save().success(function(i) {
                    console.log("instance " + i.payment_ID + " saved for user " + i.username);
                    if (i.username == null){
                        console.log("error - null user making a payment")}

                    global.db.User.find( { where: { username: i.username}})
                        .success(function(u){
                            if (u != null) {
                            u.addPayment(i);
                            global.db.Message.sendMessege("admin", i.username,
                                "Order " + i.payment_ID + " for " + i.productName + " Received");
                            } else {
                                console.log("Error - null user");
                            }})
                        .error(function(err){
                            console.log("error happened while looking for " + i.username + " not found")
                        })



                    res.status(200).send();
                }).error(function(err) {
                        console.log("instance not saved for some reason");
                        res.status(404).send("bad kitty");
                    });
            }
            catch(err) {
                console.log("general error occured")
                setTimeout(function(){
                    res.status(404).send("bad kitty")}, 5000)
            }}});

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
