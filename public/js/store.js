var fromusd = 0;
var tousd = 0;
var fromjpy = 0;
var tojpy = 0;

// options to set up our countup counters for the exchange rate
var options = {
    useEasing : true,
    useGrouping : true,
    separator : ',',
    decimal : '.'
    }

// this will be called every iteration
var updateCouter = function() {
    socket.emit('getUSDBTC');
    socket.emit('getJPYBTC');
    usd = null; jpy = null;
    var usd = new countUp("usdtargetprice", fromusd, tousd, 2, 10, options);
    var jpy = new countUp("jpytargetprice", fromjpy, tojpy, 1, 15, options);
    usd.start();
    jpy.start();
    }
var c = function() {
    updateCouter();
    setTimeout(function() {
    d();
    }, 1000);
}
var d = function() {
    setTimeout(function() {
    c();
    }, 30000);
}

socket.on('USDBTC', function(data){
    fromusd = tousd;
    tousd = data.amnt;
});

socket.on('JPYBTC', function(data){
    fromjpy = tojpy;
    tojpy = data.amnt;
})

// Declare our variables ... for now, only two cards.  If we get too many store items
// we will have to automate that with jquery regex expressions
var suica_prices = $('#suicaPrices');
var pasmo_prices = $('#pasmoPrices');

var suica_d =$('#suicaDesc');
var pasmo_d = $('#pasmoDesc')
var suica_code = $('#suicaCode');
var pasmo_code = $('#pasmoCode');

// Start with hiding all components
suica_d.hide();
pasmo_d.hide();
suica_code.hide();
pasmo_code.hide();

suica_prices.hide();
pasmo_prices.hide();

// socket sends us a code for a button
socket.on('buttonCode', function(data){
    var buttonCode = data.buttonCode;
    var cardType = data.cardType;
    switch(cardType.toLowerCase().trim())
    {
        case 'suica':
            if(buttonCode == null){
                suica_code.html('Hmm ... Coinbase is not responding');
                break;
            }
            suica_code.fadeOut(function(){
                suica_code.html('<a class="coinbase-button" data-code="' + buttonCode + '" ' +
                    'href="https://coinbase.com/checkouts/' + buttonCode + '"> Generating ... </a>' +
                    '<script src="https://coinbase.com/assets/button.js" type="text/javascript"></script>');
                suica_code.show();
            });
            break;
        case 'pasmo':
            if(buttonCode == null){
                pasmo_code.html('Hmm ... Coinbase is not responding');
                break;
            }
            pasmo_code.fadeOut(function(){
                pasmo_code.html('<a class="coinbase-button" data-code="' + buttonCode + '" ' +
                    'href="https://coinbase.com/checkouts/' + buttonCode + '"> Generating ... </a>' +
                    '<script src="https://coinbase.com/assets/button.js" type="text/javascript"></script>');
                pasmo_code.show();
            })
            break;
        default:
            console.log('store.js - not able to find the correct card type')
    }
});

// Controlling what happens when you click on a picture.  It should fade everything out and
// start 'fresh' with only the buy button

$('#suicaPic').click(function(){
    suica_prices.fadeOut(function(){
        suica_d.fadeOut();
        $('#suicaBuyButton').fadeIn();
    });
});

$('#pasmoPic').click(function(){
    pasmo_prices.fadeOut(function(){
        pasmo_d.fadeOut();
        $('#pasmoBuyButton').fadeIn();
    })
});

// Next we change the behaviour of the buy button.  It should give us some range of payments

$('#suicaBuyButton').click(function(){
    $('#suicaBuyButton').fadeOut(function(){
        suica_prices.slideToggle();
    });
});

$('#pasmoBuyButton').click(function(){
    $('#pasmoBuyButton').fadeOut(function(){
        pasmo_prices.slideToggle();
    })
});

// This is the boring part to cover ALL the buttons.  4 choices per card times two cards

var ChangePasmoDescription = function(d){
    pasmo_d.fadeOut(function(){
        pasmo_d.html(d).fadeIn();
    });
};
var ChangeSuicaDescription = function(d){
    suica_d.fadeOut(function(){
        suica_d.html(d).fadeIn();
    });
};
var ChangePasmoButtonState = function(){
    $( 'a[id^="pasmo"]').each(function(){
        $(this).removeClass('active')
    });
};
var ChangeSuicaButtonState = function(){
    $( 'a[id^="suica"]').each(function(){
        $(this).removeClass('active')
    });
};

// For the actual buttons
$('#suica1000').click(function(){
    ChangeSuicaButtonState();
    $(this).addClass('active');
    ChangeSuicaDescription('<p>For those who want to try it out</p>');
    socket.emit('getCode', {cardType: 'Suica', amount: 1000})
});
$('#pasmo1000').click(function(){
    ChangePasmoButtonState();
    $(this).addClass('active');
    ChangePasmoDescription('<p>For those who are starting out and like the color pink</p>');
    socket.emit('getCode', {cardType: 'Pasmo', amount: 1000})
});
$('#suica5000').click(function(){
    ChangeSuicaButtonState();
    $(this).addClass('active');
    ChangeSuicaDescription('<p>For the experienced suica users.</p>');
    socket.emit('getCode', {cardType: 'Suica', amount: 5000})
});
$('#pasmo5000').click(function(){
    ChangePasmoButtonState();
    $(this).addClass('active');
    ChangePasmoDescription('<p>For those who feel comfortable and a bit more experienced.</p>');
    socket.emit('getCode', {cardType: 'Pasmo', amount: 5000})
});

$('#suica10000').click(function(){
    ChangeSuicaButtonState();
    $(this).addClass('active');
    ChangeSuicaDescription('<p>For those who know what they are doing</p>');
    socket.emit('getCode', {cardType: 'Suica', amount: 10000})
});

$('#pasmo10000').click(function(){
    ChangePasmoButtonState();
    $(this).addClass('active');
    ChangePasmoDescription('<p>For the experienced and the passionate ones.</p>')
    socket.emit('getCode', {cardType: 'Pasmo', amount: 10000})
});

$('#suica20000').click(function(){
    ChangeSuicaButtonState();
    $(this).addClass('active');
    ChangeSuicaDescription('<p>For the professionals (also best value)</p>');
    socket.emit('getCode', {cardType: 'Suica', amount: 20000})
});

$('#pasmo20000').click(function(){
    ChangePasmoButtonState();
    $(this).addClass('active');
    ChangePasmoDescription('<p>For the professionals (also the best value)</p>')
    socket.emit('getCode', {cardType: 'Pasmo', amount: 20000})
})