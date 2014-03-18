var express = require('express')
    , connect = require('connect')
    , cookie = require('cookie')
    , routes  = require('./routes')
    , http    = require('http')
    , passport = require("passport")
    , flash = require('connect-flash')
    , usr = require('connect-roles')
    , passportSocketIo = require('passport.socketio')
    , io = require('socket.io')
    , app = express()
    , parseSignedCookie = connect.utils.parseSignedCookie;

require('./model/index')
console.log("connecting session store")
var MemoryStore = express.session.MemoryStore
sessionStore = new MemoryStore();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('port', process.env.PORT || 63195);
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser(process.env.COOKIE_SECRET));
    app.use(express.session({ secret: process.env.SESSION_SECRET, key: 'connect.sid', store: sessionStore}));
    app.use(passport.initialize());
    app.use(passport.session())
    app.use(flash());
    app.use(app.router);
    app.use(usr);
})

require('./config/passport')(passport)
require('./config/connectroles')(usr)
require('./routes')(app, passport, usr);

srv = http.createServer(app);
var sio = io.listen(srv);
module.exports = global.sio;

sio.configure(function(){
    sio.set("transports", ["xhr-polling"]);
    sio.set("polling duration", 10);
    sio.set("log level", 2);
    sio.set("heartbeat timeout", 60000)
})

global.db.sequelize.sync({force: false}).complete(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("starting server authorization")
        sio.set("authorization", function (data, callback){
            var store = sessionStore;
            if(data.headers.cookie){
                data.cookie = cookie.parse(data.headers.cookie);
                data.sessionID = parseSignedCookie(data.cookie['connect.sid'], process.env.SESSION_SECRET)
            }
            callback(null, true);
        })
        srv.listen(app.get('port'), function() {
            console.log("server is listening on " + app.get('port'))
        });
    }
});

//listening for connections
sio.on('connection', function(socket){
    var user = null;
    var sessionID = socket.handshake.sessionID;
    global.sessionStore.get(sessionID, function(err, session){
        if(!session || err){
            console.log(' no session found ')
           return null;
        }
        if(session.passport.user){
            global.db.User.find( { where: {username: session.passport.user}}).success(function(u){
                socket.join(u.username);
                // We found a user in our system who has been authenticated by passportJS
                require('./config/socket/socketcontrol')(socket, u);
                require('./config/socket/socket_email')(socket, u);
                require("./config/socket/socket_store")(socket, u);
                //TODO: add socket admin for authorized users
                socket.emit('hello');
                })
            } else {
            // This means we have an anon user or someone who is not authenticated.
                socket.join(sessionID);
                require('./config/socket/socketgeneral')(socket);
            }
    })
})









