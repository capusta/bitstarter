var hash = require('../config/hash.js')
var crypto = require('../config/mycrypto.js')
var validator = require('validator');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
            username: {type: DataTypes.STRING, unique: true, allowNull: false,
                validate: {
                    isAlphanumeric: true
                }
            },
            phash: {type: DataTypes.STRING(255), unique: true, allowNull: false},
            usertype: {type: DataTypes.STRING, allowNull: false, defaultValue: 'user'},
            name: {type: DataTypes.STRING, allowNull: true, defaultValue: 'Anon',
                set: function(v){
                    return this.setDataValue('name', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('name'));
                }
            },
            addressOne: {type: DataTypes.STRING, allowNull: true, defaultValue: '123 Anon Drive',
                set: function(v){
                    this.setDataValue('addressOne', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('addressOne'));
                }
            },
            addressTwo: {type: DataTypes.STRING, allowNull: true, defaultValue: 'City, State, Country, Zip',
                set: function(v){
                    return this.setDataValue('addressTwo', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('addressTwo'));
                }
            },
            email: {type: DataTypes.STRING, allowNull: true, defaultValue: 'user@domain.com',
                validate: {
                    isEmail: function(v){
                        if(!validator.isEmail(crypto.decrypt(v))){
                            throw  new Error("Not Valid Email");
                        }
                    }
                },
                set: function(v){
                    return this.setDataValue('email', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('email'));
                }
            },
            homeBTC: {type: DataTypes.STRING, allowNull: false, defaultValue: "1BTCorgHwCg6u2YSAWKgS17qUad6kHmtQW",
                validate: {
                    isLength: function(v){
                        if(!validator.isLength(crypto.decrypt(v), 27, 34)){
                            throw  new Error("Not Valid Bitcoin Address")
                        }
                    }
                },
                set: function(v){
                    return this.setDataValue('homeBTC', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('homeBTC'));
                }
            },
            //once a user pays, we will make sure that one of the input addresses into the blockchain matches the
            //address listed on the profile.
            paymentBTC: {type: DataTypes.STRING, allowNull: true, defaulValue: '0',
                set: function(v){
                    return this.setDataValue('paymentBTC', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('paymentBTC'));
                }
            },
            //for password resets and stuff
            oneTimeSecret: {type: DataTypes.STRING, allowNull:true},
            //tracks what the user thinks is going to happen next.
            stepNumber: {type: DataTypes.STRING, allowNull: false, defaultValue: "0"},
            //for future use, maybe
            bitMessegeAddr: {type: DataTypes.STRING, allowNull: true, defaultValue: '',
                set: function(v){
                    return this.setDataValue('bitMessegeAddr', crypto.encrypt(v.toString('utf8')));
                },
                get: function(){
                    return crypto.decrypt(this.getDataValue('bitMessegeAddr'));
                }
            }
    }, {
        classMethods: {
        signup: function(uname, pword, done) {
            hash(pword, process.env.SALT, function(err, ret_hash){
                if (err) {done(err, null, {message: "bad hash"})}

                global.db.User.build({ username: uname.toLowerCase(), phash: ret_hash.toString('base64')}).save()
                    .success(function(u){console.log(uname + " signed up")
                        done(null, u);})
                    .error(function(err){
                        console.log("got error on signup " + err.message)
                        done(err.message, null)
                    })
            })
        }},

        instanceMethods: {
            validPassword: function(pword, answer) {
                     var myhash = this.phash;
                     var uname = this.username;
                     hash(pword, process.env.SALT, function (err, ret_hash) {
                        if (err) {return answer(false);}
                        if (ret_hash.toString('base64') !== myhash) {
                            answer(false);
                     }
                     else {
                            console.log(uname + " authenticated / logged in");
                            return answer(true);
                     }});
              },
            changepassword: function(p, callback){
                //kind of strange notation, but cannot call "this" in the hash function
                    usr=this;
                hash(p, process.env.SALT, function(err, ret_hash){
                    if (err){
                             console.log("password change for user " + usr.username + " failed ")
                             callback(false)
                         }
                    else {
                        console.log("password changed for " + usr.username);
                        usr.updateAttributes({phash: ret_hash.toString('base64')});
                        callback(true)
                    }
                })
            }
        }
        }
    )
}


