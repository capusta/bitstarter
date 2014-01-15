ejs = require('ejs'),
    fs      = require('fs'),
    rest = require('restler')

module.exports = function(socket, user){

    socket.on('get_mycards', function(){
    var path = "./views/partials/moneycards.ejs"
    var cards_json = []

        user.getMoneycards().success(function(cards){
            cards.forEach(function(c){
                cards_json.push({cid: c.cardID, ct: c.type, cm: c.condition, amt: c.amount})
            })
            socket.emit('mymoneycards', {data: ejs.render(fs.readFileSync(path).toString(), {cards: cards_json})})
        })
});
    socket.on('get_orders', function(){
    var path = "./views/partials/orders.ejs";
    var payments_json = [];
    user.getPayments().success(function(payments){
        payments.forEach(function(p){
            payments_json.push({pid: p.payment_ID, amount: p.amount, pname: p.productName})
        })
        socket.emit('myorders', {data: ejs.render(fs.readFileSync(path).toString(), {orders: payments_json})})
})
} )
    socket.on('get_profile', function(){
        var path = "./views/partials/myprofile.ejs"
        var profile_json = []
        profile_json.name = user.dataValues.name
        profile_json.addressOne = user.dataValues.addressOne
        profile_json.addressTwo = user.dataValues.addressTwo
        profile_json.homeBTC = user.dataValues.homeBTC
        socket.emit('myprofile', {data: ejs.render(fs.readFileSync(path).toString(), {profile: profile_json})})
    })
    socket.on('get_messeges', function(){
    var path = "./views/partials/messeges.ejs"
    var messeges_json = [];
            user.getMesseges().success(function(messeges){
                messeges.forEach(function(c){
                    messeges_json.push({time: c.time, from: c.from, message: c.message})
                })
                socket.emit('mymesseges', {data: ejs.render(fs.readFileSync(path).toString(), {messeges: messeges_json})})
            })
    })
    socket.on('get_shop', function(){
        var path = "./views/partials/cardshop.ejs";
        var bc = [];
        var done = false;

        var bodyVerification = {
            "button":{
                "name": "VerifyY50",
                "type": "buy_now",
                "price_string": "50",
                "price_currency_iso": "JPY",
                "custom": user.dataValues.username,
                "callback_url": "https://suimo-stage.herokyapp.com/paymentcomplete?secret="+process.env.PAYMENT_COMPLETE_SECRET,
                "description": "Address verification (refundable)",
                "style": "custom_small",
                "include_email":true
            }
        }
        //TODO: DOUBLE CHECK THE POST REQUESTS THEN RENDER
        rest.postJson('https://coinbase.com/api/v1/buttons?api_key='+process.env.COINBASE_API_KEY, bodyVerification).
            on('complete', function(data, response){
                if(data.success){
                    done = true;
                    console.log("data is successful")
                    bc.push(data.button.code);
                    socket.emit('displayshop', {
                        data: ejs.render(fs.readFileSync(path).toString(),{
                            u: user.dataValues.username,
                            buttonCodes: bc})});
                } else {
                    console.log("post request not successful")
                }
            })



    })
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
        user.save();
    })
    socket.on('checkStepB', function(){
     user.stepNumber = user.stepNumber.concat('b');
        user.save().success(function(){
            socket.emit('push_dashboard');
        })
    })
    socket.on('checkStepC', function(){
        user.stepNumber = user.stepNumber.concat('c');
        user.save().success(function(){
            socket.emit('push_dashboard');
        })
    })
    socket.on('checkStepD', function(){
        user.getPayments().success(function(payments){
            if(payments && payments.length > 0){
                user.stepNumber = user.stepNumber.concat('d');
                user.save().success(function(){
                    socket.emit('push_dashboard');
                });

            }
        })
    })
    socket.on('checkStepE', function(){
        user.stepNumber = user.stepNumber.concat('e');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    })
    socket.on('checkStepF', function(){
        user.stepNumber = user.stepNumber.concat('f');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    })
    socket.on('checkStepG', function(){
        user.stepNumber = user.stepNumber.concat('g');
        user.save().success(function(){
            socket.emit('push_dashboard');
        });
    })
    socket.on('clear_checklist', function(){
        user.stepNumber = "0";
        user.save;
        socket.emit('push_dashboard');
    })
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
    socket.emit('renderchart', {content: ejs.render(fs.readFileSync(path).toString(),
        {chart: chartdata, step_a: step_a, step_b: step_b, step_c: step_c, step_d: step_d, step_e: step_e, step_f: step_f,
            step_g: step_g})})
})

}
      /*<!--&lt;!&ndash;<% if (user.usertype === 'admin') { %>-->
      <!--<a href="/admin" class="btn btn-info btn-mini"><i class="icon-home"></i></a><br>-->
      <!--<% } %>&ndash;&gt;-->*/

