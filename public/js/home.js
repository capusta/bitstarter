/* Our basic lay out is going to be a 3 x 3 grid.  Each step is labeled a-h
* each square's height is going to be aligned with the row height and buttons aligned
* to the bottom.*/

//First things first.  Get the heights of our fluid rows
var r1 = $('#rowOne').height();
var r2 = $('#rowTwo').height();
var r3 = $('#rowThree').height();

//Second.  Set the heights of our divs, because they are made for best fit by default.
$('#stepA, #stepB, #stepC').height(r1);
$('#stepD, #stepE').height(r2)
$('#stepF, #stepG, #stepH').height(r3);

$('#checkStepA').click(function(e){
    e.preventDefault();
    socket.emit('get_profile');
})
$("#checkStepB").click(function(e){
    e.preventDefault();
    socket.emit('checkStepB');
})
$("#checkStepC").click(function(e){
    e.preventDefault();
    socket.emit('checkStepC');
})
$("#checkStepD").click(function(e){
    e.preventDefault();
    socket.emit('checkStepD');
})
$("#checkStepE").click(function(e){
    e.preventDefault();
    socket.emit('checkStepE');
})
$("#checkStepF").click(function(e){
    e.preventDefault();
    socket.emit('checkStepF');
})
$("#checkStepG").click(function(e){
    e.preventDefault();
    socket.emit('checkStepG');
})
$("#clearChecklist").click(function(e){
    socket.emit('clear_checklist');
    e.preventDefault();
})

$('#checkStepH').click(function(e){
    e.preventDefault();
    socket.emit('send user delete request');
    $('#checkStepH').fadeOut();
    $('#Step8Paragraph').append('<b>Email Sent</b>')
})
// Little odd one out - changes the button text - when no orders have been received.
socket.on('no_payments', function(){
    var d = $('#checkStepD');
    d.fadeOut(function(){
        d.html('<b>No Orders Found</b>').fadeIn();
    });
})
