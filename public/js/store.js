var priceList =$('#suicaPrice');
var desc =$('#suicaDesc');
desc.hide();
priceList.hide();
$('#suicaPic').click(function(){
    priceList.fadeOut(function(){
        desc.fadeOut();$('#suicaBuy').fadeIn();
    });
})
$('#suicaBuy').click(function(){
    $('#suicaBuy').fadeOut(function(){
        priceList.slideToggle();
    });
});
$('#suica1000').click(function(){
    $( 'a[id^="suica"]').each(function(){
        $(this).removeClass('active')
    });
    $(this).addClass('active');
    desc.fadeOut(function(){
        desc.html('<p>For those who want to try it out</p>').fadeIn();
    });
});
$('#suica5000').click(function(){
    $( 'a[id^="suica"]').each(function(){
        $(this).removeClass('active')
    });
    $(this).addClass('active');
    desc.fadeOut(function(){
        desc.html('<p>For the experienced suica users.</p>').fadeIn();
    });
});
$('#suica10000').click(function(){
    $( 'a[id^="suica"]').each(function(){
        $(this).removeClass('active')
    });
    $(this).addClass('active');
    desc.fadeOut(function(){
        desc.html('<p>For those who know what they are doing</p>').fadeIn();
    });
});
$('#suica20000').click(function(){
    $( 'a[id^="suica"]').each(function(){
        $(this).removeClass('active')
    });
    $(this).addClass('active');
    desc.fadeOut(function(){
        desc.html('<p>For the professionals (also best value)</p>').fadeIn();
    });
});