// Define routes for simple SSJS web app. 
// Writes Coinbase orders to database.
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
  , SequelizeStore = require('connect-session-sequelize')(express)
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
    app.use(express.session({ secret: process.env.SESSION_SECRET, key: 'abcd', store: sessionStore}));
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(passport.session())
    app.use(flash());
    app.use(app.router);
    app.use(usr);
})



require('./config/passport')(passport)
require('./config/connectroles')(usr)
require('./routes')(app, passport, usr);


console.log("configuration done, ready for the server")

srv = http.createServer(app);
var sio = io.listen(srv);
sio.configure(function(){
    sio.set("transports", ["xhr-polling"]);
    sio.set("polling duration", 10);
    sio.set("log level", 2);
    sio.set("heartbeat timeout", 40000)
})

    console.log("socket.io authorization complete")

global.db.sequelize.sync().complete(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("starting server to listen")
        sio.set("authorization", function (data, callback){
            var store = sessionStore;
            if(data.headers.cookie){
                data.cookie = cookie.parse(data.headers.cookie);
                data.sessionID = parseSignedCookie(data.cookie['abcd'], process.env.SESSION_SECRET)
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
    var sessionStore = global.sessionStore;
    var sessionID = socket.handshake.sessionID;
    console.log("incoming connection: " + " session store: " + sessionStore + " sessionID" + sessionID)
    console.log("user is " + socket.handshake)
    sessionStore.get(sessionID, function(err, session){
        if(!session){
           return null;
        }
        if (! err){
            if(session.passport.user){
                global.db.User.find( { where: {username: session.passport.user}}).success(function(u){
                    require('./config/socketcontrol')(socket, u);
                    socket.emit('my_username', {username: "Welcome " + u.dataValues.username})
                })
            } else {
                require('./config/socketgeneral')(socket);
            }
        }
        else { console.log("error - cannot find session in the session store")}
    })
})









