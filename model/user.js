hash = require('../config/hash.js'),
crypto = require('../config/mycrypto.js'),
validator = require('validator');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
            username: {type: DataTypes.STRING, unique: true, allowNull: false,
                validate: {
                    isAlphanumeric: true,
                    len: [4,20]
                }},
            phash: {type: DataTypes.STRING(255), unique: false, allowNull: false},
            usertype: {type: DataTypes.STRING, allowNull: false, defaultValue: 'user'},
            name: {type: DataTypes.STRING, allowNull: true, defaultValue: 'Weary Traveler',
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('name', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('name'));
                    return ans.slice(5,ans.length-5);
                }
            },
            addressOne: {type: DataTypes.STRING, allowNull: true, defaultValue: '123 Pilsburry Drive',
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    this.setDataValue('addressOne', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('addressOne'));
                    return ans.slice(5,ans.length-5);
                }
            },
            addressTwo: {type: DataTypes.STRING, allowNull: true, defaultValue: 'City, State/Country, Zip',
                set: function(v){
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('addressTwo', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('addressTwo'));
                    return ans.slice(5,ans.length-5);
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
                    n = (crypto.generate(5)).concat(v).concat(crypto.generate(5));
                    return this.setDataValue('email', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    ans = crypto.decrypt(this.getDataValue('email'));
                    return ans.slice(5,ans.length-5);
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
                    var v = this.getDataValue('paymentBTC');
                    if(v !== null && v != '0'){
                        return crypto.decrypt(this.getDataValue('paymentBTC'));
                    }
                    else{
                        return v;
                    }
                }
            },
            //for password resets and stuff
            oneTimeSecret: {type: DataTypes.STRING, allowNull:true,
                set: function(v){
                    //format for encoding is [random 5] + [action] + [comma] + username + [random 5]
                    n = (crypto.generate(5))+(v)+","+this.getDataValue('username')+crypto.generate(5);
                    return this.setDataValue('oneTimeSecret', crypto.encrypt(n.toString('utf8')));
                },
                get: function(){
                    //we have an instance method to decode this because this could be anything
                    return (this.getDataValue('oneTimeSecret'));
                }
            },
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
            },
            BTCverified: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 'FALSE',
                set: function(v){
                    result = this.getDataValue('paymentBTC') == this.getDataValue('homeBTC');
                    return this.setDataValue('BTCverified', result);
                },
                get: function(){
                    result = this.getDataValue('paymentBTC') == this.getDataValue('homeBTC');
                    return result;
                }
            },
            emailVerified: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 'FALSE'},
            emailCount: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
            alert: {type: DataTypes.STRING, allowNull: true, defaultValue: ''}
    }, {
        classMethods: {
        signup: function(uname, pword, done) {
            hash(pword, process.env.SALT, function(err, ret_hash){
                if (err) {done(err, null, {message: "bad hash"})}

                global.db.User.build({ username: uname.toLowerCase(), phash: ret_hash.toString('base64')}).save()
                    .success(function(u){console.log(uname + " signed up")
                        done(null, u);})
                    .error(function(err){
                        console.log("User model got error on signup " + err.message)
                        done(err, null)
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
            },
            removeOneTimeSecret: function(callback){
                //breaking my abstraction a little bit
                this.setDataValue('oneTimeSecret', null);
                callback(null);
            },
            getSecretAction: function(callback){
                try {
                    ans = crypto.decrypt(this.getDataValue('oneTimeSecret'));
                    callback(null, ans);
                } catch(err){
                    callback(err, null);
                }
            },
            hasCashCardAlert: function(){
                i = this.getDataValue('alert');
                if(i !== null && ~i.indexOf('c')){
                    this.updateAttributes({alert: i.replace(/c/g,'')});
                    return true;
                } else {return false};
            },
            hasMessegesAlert: function(){
                i = this.getDataValue('alert');
                if(i !== null && ~i.indexOf('m')){
                    this.updateAttributes({alert: i.replace(/m/g,'')});
                    return true;
                } else { return false;};
            }
        }
        }
    )
}


