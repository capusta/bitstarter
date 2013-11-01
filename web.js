// Define routes for simple SSJS web app. 
// Writes Coinbase orders to database.
var express = require('express')
  , routes  = require('./routes')
  , http    = require('http')
  , db      = require('./models')
  , passport = require("passport")
  , flash = require('connect-flash')
  , util = require('util')
  , fs      = require('fs')
  , usr = require('connect-roles');



var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 63195);
app.use(express.cookieParser(process.env.COOKIE_SECRET));
app.use(express.bodyParser());
app.use(express.session({ secret: process.env.SESSION_SECRET }));
app.use(flash());

app.use(passport.initialize());

app.use(express.static(__dirname + '/public'));
app.use(passport.session())
app.use(app.router);
app.use(usr);
var io = require('socket.io');

require('./config/passport')(passport)
require('./config/connectroles')(usr)
require('./routes')(app, passport, usr);

// sync the database and start the server
db.sequelize.sync().complete(function(err) {
  if (err) {
    throw err;
  } else {
      console.log("Sequelize sync complete on  " + app.get('port'));
    srv = http.createServer(app).listen(app.get('port'), function() {
       //global.db.User.sync({force: true})
    });

      // socket server listening for events
      io.listen(srv).sockets.on('connection', function(socket){
          console.log("connected");

          socket.on('set username', function(data){
              console.log("setting username " + data.username)
              socket.set('username', data.username, function () {
                  socket.emit('my_username', {username: data.username});
                  console.log("logged in: " + data.username);
              })
          })
          socket.on('get username', function(){
              socket.get('username', function(err, u){
                  if(err){console.log("error - cannot get socket username")}
                  else {
                      socket.emit('my_username', {username: u});
                  }
              })
          })
      })
  }
});








