      ejs = require('ejs')
    , fs      = require('fs')

module.exports = function(socket){

socket.on('check_username', function(data){
    var n = 0;

    global.db.User.findAndCountAll( { where: {username: data.username.trim().toLowerCase()}}).success(function(result){
        n = result.count;
        console.log("checked records and got " + n + " results .. checked for " + data.username)
        if (n != 0){
            socket.emit('username_bad');
        } else { socket.emit('username_good')}
    })
});

}
