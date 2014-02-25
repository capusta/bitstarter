ejs = require('ejs')
    , fs      = require('fs')
    , validator = require('validator')

module.exports = function(socket){

socket.on('check_username', function(data){
        var n = 0;
    global.db.User.findAndCountAll( { where: {username: data.username.trim().toLowerCase()}}).success(function(result){
        n = result.count;
        if (n != 0){
            socket.emit('username_bad');
        } else { socket.emit('username_good')}
    })
});

}