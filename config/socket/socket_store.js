fs      = require('fs'),
    path = require('path'),
    ejs = require('ejs'),
    request = require('request'),
    host = 'coinbase.com',
    hostpath = '/api/v1/buttons';

//we will be handing all payment code here

module.exports = function(socket, user){

    socket.on('getCardItem',function(data){
        var storeItem = "./views/partials/storeItem.ejs";
        var msg = "render"+data.cardType;
        var card = data.cardType.toString();
        var imgURL = "";
        if (card == "Suica"){
            imgURL = "https://dl.dropboxusercontent.com/u/8869944/suimo/suica.png";
        } else {
            imgURL = "https://dl.dropboxusercontent.com/u/8869944/suimo/passmo.png"
        };
        //TODO: Expanding the store - will have to change the images logic
        newData = ejs.render(fs.readFileSync(storeItem).toString(), {
            imgURL: imgURL,
            choices:
                [   {id: card.toLowerCase()+",10", desc: "\&yen;1000 Trial " + card + " - See if you like it"},
                    {id: card.toLowerCase()+",50", desc: "\&yen;5000 - if you are comfortable"},
                    {id: card.toLowerCase()+",100", desc: "\&yen;10,000 - for those experienced " + card + "-ers"},
                    {id: card.toLowerCase()+",200", desc: "\&yen;20,000 - really, the best value"}]
        });
        socket.emit("renderItem", {data: newData});
    });

    /* Verifications.  A user does not have to do this because all input addresses are checked against the
    * user's registered bitcoin address.  in case nothing is found, or the hash does not exist, we store the
    * given hash and come back to it later*/
    socket.on('verifyMe', function(){
        var html = ""
            , resbody = ''
            , nonce = new Date().getTime()
            , sig = require('crypto').createHmac('sha256', process.env.COINBASE_SECRET)
            , buttonCode = ''
            , button = { 'button': {
            'name': 'Verification',
            'type': 'buy_now',
            'price_string': 50,
            'price_currency_iso': 'JPY',
            'custom': user.username,
            'callback_url': process.env.PAYMENT_CALLBACK + "?secret="+process.env.PAYMENT_COMPLETE_SECRET,
            'text': 'Verify',
            'custom_secure':'true',
            'style': 'custom_small',
            'description': "Refund address verification - " + user.username
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
                    console.log('verification code not errored out')
                    buttonCode = JSON.parse(resbody).button.code;
                    socket.emit('renderVerification', {buttonCode: buttonCode})
                    console.log('verification render emitted')
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
        var storePayment = "./views/partials/storePayment.ejs"
            , d = data.id.split(',')
            , amnt = parseInt(d[1])*100; var card = d[0].toLowerCase()
            , resbody = ''
            , nonce = new Date().getTime()
            , sig = require('crypto').createHmac('sha256', process.env.COINBASE_SECRET)
            , buttonCode = '';

        var button = { 'button': {
            'name': card.toUpperCase()+"-"+ "Y"+(amnt),
            'type': 'buy_now',
            'price_string': amnt+1000,
            'price_currency_iso': 'JPY',
            'custom': user.username,
            'callback_url': process.env.PAYMENT_CALLBACK + "?secret="+process.env.PAYMENT_COMPLETE_SECRET,
            'description': "Japanese " + card + " e-cash card",
            'text': 'Place Order.',
            'custom_secure':'true',
            'style': 'custom_small',
            'description': user.username+","+card.toUpperCase()+","+amnt
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
                    newData = ejs.render(fs.readFileSync(storePayment).toString(), {
                        bullets: [
                            {desc: "\&yen;500 Card Deposit (refundable)"},
                            {desc: "\&yen;500 Fee (includes shipment)"},
                            {desc: "\&yen;"+(amnt) + " Usable Funds (remainder refundable)"},
                            {desc: "TOTAL: \&yen;" + (amnt+1000)}],
                        buttonCode: buttonCode
                    });
                    socket.emit("renderPayment", {data: newData})
                } catch(err) {
                    console.log('unable to parse coinbase reply for ' + user.username)
                }
            })
        });
        v.write(bodydata);
        v.end();
    })
}
