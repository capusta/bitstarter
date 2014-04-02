fs      = require('fs'),
    path = require('path'),
    ejs = require('ejs'),
    request = require('request'),
    host = 'coinbase.com',
    hostpath = '/api/v1/buttons';

//we will be handing all payment code here

module.exports = function(socket, user){

    //Loading teh Store from the socket request
    socket.on('get_shop', function(){
        var shopPath = "./views/partials/cardshop.ejs";
        socket.emit('rendershop', {
            data: ejs.render(fs.readFileSync(shopPath).toString(),{
                //username is needed to send to coinbase for the custom codes
                u: user.dataValues.username})});
    });
    /* Verifications.  A user does not have to do this because all input addresses are checked against the
    * user's registered bitcoin address.  in case nothing is found, or the hash does not exist, we store the
    * given hash and come back to it later*/
    socket.on('verifyMe', function(){
        var html = ""
            , resbody = ''
            , nonce = new Date().getTime()
            , sig = require('crypto').createHmac('sha256', process.env.COINBASE_SECRET.toString())
            , buttonCode = ''
            , button = { 'button': {
            'name': 'Verification',
            'type': 'buy_now',
            'price_string': 50,
            'price_currency_iso': 'JPY',
            'custom': user.username,
            'callback_url': process.env.PAYMENT_CALLBACK + "?secret="+process.env.PAYMENT_COMPLETE_SECRET,
            'text': 'Verification',
            'custom_secure':'true',
            'style': 'custom_small',
            'description': "Refund address verification - " + user.username,
            'success_url': process.env.SUCCESS_URL
            }
            };
        var bodydata = JSON.stringify(button);
        sig.update(new Buffer(nonce.toString() + 'https://' + host + hostpath + bodydata, 'utf8'));
        sig = sig.digest('hex');
        var options = {
            host: host,
            path: hostpath,
            method: 'POST',
            headers: {
                'Connection': 'close',
                'User-Agent': 'nodeJS',
                'ACCESS_KEY': process.env.COINBASE_KEY,
                'ACCESS_SIGNATURE': sig,
                'ACCESS_NONCE': nonce,
                'Content-Type': 'application/json'
            }
        };

        var v = https.request(options, function(res){
            if(res.statusCode != 200) {
                console.log("error occured communicating with coinbase - error " + res.statusCode);
                return;
            }
            res.on('data', function(d){
                resbody += d;
            });
            res.on('end', function(){
                try{
                    buttonCode = JSON.parse(resbody).button.code;
                    socket.emit('renderVerification', {buttonCode: buttonCode})
                    console.log(user.username + " is verifying account")
                } catch(err) {
                    console.log('unable to parse coinbase reply for ' + user.username + " verification")
                }
            })
        });
        v.write(bodydata);
        v.end();
        console.log('verification request sent')
    })

    /*Code for getting a button name and generating a Coinbase ID for the button.
     * The ID code is used to generate the payment button*/
    socket.on('getCode', function(data){
        try {
            var amnt = parseInt(data.amount);
            var cardName = data.cardType.toString();
        }
        catch(err){
            console.log('unable to parse the amount from cardshop.ejs')
            return;
        }
            var resbody = ''
            , nonce = new Date().getTime()
            , sig = require('crypto').createHmac('sha256', process.env.COINBASE_SECRET)
            , buttonCode = '';

        var button = { 'button': {
            'name': cardName.toUpperCase()+"-"+ "Y"+(amnt),
            'type': 'buy_now',
            'price_string': amnt+1000,
            'price_currency_iso': 'JPY',
            'custom': user.username,
            'callback_url': process.env.PAYMENT_CALLBACK + "?secret="+process.env.PAYMENT_COMPLETE_SECRET,
            'description': "Japanese " + cardName + " e-cash card",
            'text': 'Order Y' + amnt + " " + cardName,
            'custom_secure':'true',
            'style': 'custom_small',
            'description': user.username+","+cardName.toUpperCase()+","+amnt+" on the card"
            }
        };
        var bodydata = JSON.stringify(button);
        sig.update(new Buffer(nonce.toString() + 'https://' + host + hostpath + bodydata, 'utf8'));
        sig = sig.digest('hex');
        var options = {
            host: host,
            path: hostpath,
            method: 'POST',
            headers: {
                'Connection': 'close',
                'User-Agent': 'nodeJS',
                'ACCESS_KEY': process.env.COINBASE_KEY,
                'ACCESS_SIGNATURE': sig,
                'ACCESS_NONCE': nonce,
                'Content-Type': 'application/json'
            }
        };

        // here we make the request, and when we get a button code from coinbase, we emit the code to the ejs files
        var v = https.request(options, function(res){
            if(res.statusCode != 200) {
                console.log("error occured while trying to get codes from coinbase: status code " + res.statusCode);
                socket.emit("buttonCode", {buttonCode: null, cardType: cardName.toLowerCase()})
                return;
            }
            res.on('data', function(d){
                resbody += d;
            });
            res.on('end', function(){
                try{
                    buttonCode = JSON.parse(resbody).button.code;
                    socket.emit("buttonCode", {buttonCode: buttonCode, cardType: cardName.toLowerCase()})
                } catch(err) {
                    console.log('socket_store.js - unable to parse coinbase reply for ' + user.username)
                }
            })
        });
        v.write(bodydata);
        v.end();
    })

    /*This will be used to set the coinbase exchange rates on top of the store page
    * we will get a request for the reate, query it, and return the result.  Works with cardshop.ejs*/
    var exchangeOptions = {
        host: 'coinbase.com',
        path: '/api/v1/currencies/exchange_rates',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    var usdbtc = 0;
    var jpybtc = 0;

    socket.on('getUSDBTC', function(){

        var request = require("request")
            , body = '';
        var v = https.request(exchangeOptions, function(res){
            if(res.statusCode != 200) {
                console.log("coinbase error reqeusting USD / BTC" + res.statusCode + res);
                return; }
            res.on('data', function(d){
                body += d;
            });
            res.on('end', function(){
                var o = JSON.parse(body);
                usdbtc = o.btc_to_usd;
                jpybtc = o.btc_to_jpy;
                o = null;
                socket.emit('USDBTC', {amnt: usdbtc})
            });
        });
        v.end();
    });

    socket.on('getJPYBTC', function(){
    socket.emit('JPYBTC', {amnt: jpybtc})
    })
  }
