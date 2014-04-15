var express = require('express')
    , connect = require('connect')
    , cookie = require('cookie')
    , routes  = require('./routes')
    , http    = require('http')
    , passport = require("passport")
    , flash = require('connect-flash')
    , connectRoles = require('connect-roles')
    , passportSocketIo = require('passport.socketio')
    , io = require('socket.io')
    , app = express()
    , parseSignedCookie = connect.utils.parseSignedCookie
    , usr = new connectRoles({
    failureHandler: function(req, res, action){
        console.log("web js - connect roles failure:  " + action)
        var accept = req.headers.accept || '';
        //res.status(403);
        if (~accept.indexOf('html')) {
            res.redirect("login");
            //res.send('access-denied (but can be rendered)', {action: action})
        } else {
            res.send("Access Denied - you do not have permission to: " + action);
        }
    }
});

require('./model/index')
console.log("connecting session store")
var MemoryStore = express.session.MemoryStore
var sessionStore = new MemoryStore();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 63195);
    app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"); 
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser(process.env.COOKIE_SECRET));
    app.use(express.session({ secret: process.env.SESSION_SECRET, key: 'connect.sid', store: sessionStore}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());
    app.use(app.router);
    app.use(usr.middleware());
});

require('./config/passport')(passport);
require('./config/connectroles')(usr);
require('./routes')(app, passport, usr);

var srv = http.createServer(app)
var sio = io.listen(srv);

sio.configure(function(){
    sio.set("transports", ["xhr-polling","websocket"]);
    sio.set("polling duration", 10);
    sio.set("log level", 1);
    sio.set("heartbeat timeout", 60000)
});

global.db.sequelize.sync({force: false}).complete(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("starting server authorization")
        sio.set("authorization", function (data, callback){
            if(data.headers.cookie){
                data.cookie = cookie.parse(data.headers.cookie);
                data.sessionID = parseSignedCookie(data.cookie['connect.sid'], process.env.SESSION_SECRET)
            }
            callback(null, true);
        })
        srv.listen(app.get('port'), app.get('ipaddr'), function() {
            console.log("server is listening on " + app.get('port'))
        });
    }
});

//listening for connections
sio.on('connection', function(socket){
    var user = null;
    var sessionID = socket.handshake.sessionID;
    sessionStore.get(sessionID, function(err, session){
        if(!session || err){
            console.log(' no session found ')
           return null;
        }
        if(session.passport.user){
            global.db.User.find( { where: {username: session.passport.user}}).success(function(u){
                socket.join(sessionID.toString()+ u.username);
                // We found a user in our system who has been authenticated by passportJS
                require('./config/socket/socketcontrol')(socket, u);
                require('./config/socket/socket_email')(socket, u);
                require("./config/socket/socket_store")(socket, u);
                if (u.usertype === 'admin'){ require('./config/socket/socket_admin')(socket, u); }
                socket.emit('hello');
                })
            } else {
            // This means we have an anon user or someone who is not authenticated.
                socket.join(sessionID);
                require('./config/socket/socketgeneral')(socket);
            }
    })
})









