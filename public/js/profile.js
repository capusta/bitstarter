// Let's start with the error handling first.  We will need to do some basic error checking and be
// able to display that, for passwords, email names, etc...
function scrollToElement(selector, time, verticalOffset) {
    time = typeof(time) != 'undefined' ? time : 1000;
    verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
    element = $(selector);
    offset = element.offset();
    offsetTop = offset.top + verticalOffset;
    $('html, body').animate({
        scrollTop: offsetTop
    }, time);
}

var showError = function(msg){
    e = $('#displayError');
    e.fadeOut(function(){
        e.html(msg).fadeIn();
    });
};
// We now have the ability to show error messeges as they come in from the back end
socket.on('displayError', function(data){
    showError(data.msg);
});

// turns out that socket.io does not catch an emitted even when they are both in the same file.  Events
// can only be emitted across JS files.  SO i have to 'bounce' a messege to re-render the same page.
socket.on('changeOK', function(){
    socket.emit('get_profile');
})
// Let's start by hiding all these extra layers.  We'll bring them out as we need them.
$('#nameChangediv').hide();
$('#authpassDiv').hide();
$('#authEmailChangeDiv').hide();
$('#addressOneChangeDiv, #addressTwoChangeDiv').hide();
$('#bitMessageChangeDiv').hide();
$('#btcChangeDiv, #btcChangePhoneDiv').hide();

// These are going to be all the little pencil icons that users can click to display certain portions
// of the divs that we hidden earlier
$('#authnameChange').click(function(){
    scrollToElement('#authnameChange');
    $('#nameChangediv').slideToggle();});

$('#authEmailChange').click(function(){
    scrollToElement('#authEmailChange');
    $('#authEmailChangeDiv').slideToggle();
});
$('#authAddrOneChange').click(function(){
    scrollToElement('#authAddrOneChange');
    $('#addressOneChangeDiv').slideToggle();
});
$('#authAddrTwoChange').click(function(){
    scrollToElement('#authAddrTwoChange');
    $('#addressTwoChangeDiv').slideToggle();
});
$('#authBitMessageChange').click(function(){
    scrollToElement('#authBitMessageChange');
    $('#bitMessageChangeDiv').slideToggle();
});
$('#authBTCchange').click(function(){
    scrollToElement('#authBTCchange');
    $('#btcChangeDiv').slideToggle();
});
$('#authBTCchangePhone').click(function(){
    scrollToElement('#authBTCchangePhone');
    $('#btcChangePhoneDiv').slideToggle(function(){

    });

})

// This is where all the change buttons submit the inputs to socket to be written to the database
// Code is a bit repetative, but limited and manageable.  Also allows us to add/remove fields easily
$('#authNameChangeButton').click(function(){
    b = $('#newName').val();
    if (b === null || typeof b === 'undefined' || b.trim().length == 0) {
    showError('Name Cannot be Blank');
    return;
    } else {
    socket.emit('changeUserData', {item: 'name', value: b.trim()});
}});

$('#authEmailChangeButton').click(function(){
    b = $('#newEmail').val();
    if (b === null || typeof b === 'undefined' || b.trim().length == 0){
        showError('Invalid Email');
        return;
    } else {
        socket.emit('changeUserData', {item: 'email', value: b.trim()});
    }
});

$('#authAddressOneChangeButton').click(function(){
    b = $('#newAddressOne').val();
    if (b === null || typeof b === 'undefined' || b.trim().length == 0){
        showError('Invalid Address');
        return;
    } else {
        socket.emit('changeUserData', {item: 'addressOne', value: b.trim()});
    }
});

$('#authAddressTwoChangeButton').click(function(){
    b = $('#newAddressTwo').val();
    if (b === null || typeof b === 'undefined' || b.trim().length == 0){
        showError('Invalid Address');
        return;
    } else {
        socket.emit('changeUserData', {item: 'addressTwo', value: b.trim()});
    }
});

$('#authBitmessageButton').click(function(){
    b = $('#newBitMessageVal').val();
    if (typeof b === 'undefined'){
        showError('Invalid BitMessage Address');
        return;
    } else {
        socket.emit('changeUserData', {item: 'bitmessege', value: b.trim()});
    }
});

// The two labels, when clicked, will handle the verifications for the btc and email addresses
$('#verifyMe').click(function(){
    socket.emit('send verification email');
    $('#emailDiv').html( "<b> Email Sent</b>");
});
$('#btcVerifyMe').click(function(){
    socket.emit('verifyMe');
})
// need a way to display the coinbase code for the payment.
socket.on('renderVerification', function(data){
    var buttonCode = data.buttonCode;
    $('#btcDiv').html( '<a href="https://coinbase.com/checkouts/' + buttonCode + '" target="_blank"> ' +
        '<img alt="Pay With Bitcoin" src="https://coinbase.com/assets/buttons/buy_now_small.png"></a>' );
    });

// Everything that has to do with password change.
$('#authPassChangeButton').click(function(){
    var a = $('#passOne').val();
    var b = $('#passTwo').val();
    if(a.length < 4){
    showError('Passwords are too short');
    return;
    }
if(a !== b){
    showError('Passwords do not match');
    return;
    }
    //so far everything did not error out
    socket.emit('authPassChange', a);
});
    // socket on the back end will emit a complete event and pass the error, if happened, to us here.
socket.on('authPasswordChanged', function(data){
    $('#authpassDiv').html(data.msg);
    // the above messege could be an error - which means that nothing happened on the back end.
    });
$('#authPassChange').click(function(){
    $('#authpassDiv').slideToggle();
    })


// Misc tooltips to make thie page less shitty
$('#profileLabel').tooltip({ animation: true, html: true});
$('#settings').tooltip({ animation: true, html: true})
$('#btcVerified').tooltip({animation: true, html:true})
$('#emailVerified').tooltip({animation: true, html:true});
$('#btcVerifyMe').tooltip({animation: true, html: true});
$('#btcVerifiedPhone').tooltip({animation: true, html: true});
$('#verifyMe').tooltip({animation: true, html:true})

//the final  button ...
$('#looksGood').click(function(){
    socket.emit('changeUserData', {item: 'finished', value: null});
})


