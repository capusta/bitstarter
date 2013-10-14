var hash = require('../config/hash.js')

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
            username: {type: DataTypes.STRING, unique: true, allowNull: false,
            validate: {
                isAlphanumeric: true
            }},
            phash: {type: DataTypes.STRING(255), unique: true, allowNull: false,
                    set: function(p){
                        this.setDataValue('phash', p);
                    },
                    get: function(){
                        return this.getDataValue('phash')
                    }
            },
            usertype: {type: DataTypes.STRING, allowNull: false, defaultValue: "user"},
            name: {type: DataTypes.STRING, allowNull: true, defaultValue: "Anon Smith"},
            addressOne: {type: DataTypes.STRING, allowNull: true, defaultValue: "123 Parkside Drive"},
            addressTwo: {type: DataTypes.STRING, allowNull: true, defaultValue: "San Francisco, CA, 94519"},
            email: {type: DataTypes.STRING, allowNull: true, defaultValue: "user@domain.com",
            validate: {
                isEmail: true
            }},
            homeBTC: {type: DataTypes.STRING, allowNull: false, defaultValue: "1BTCorgHwCg6u2YSAWKgS17qUad6kHmtQW"},
            oneTimeSecret: {type: DataTypes.STRING, allowNull:true}
    }, {
        setterMethods: {
          phash: function(p) { this.setDataValue('phash', p)}
        },
        classMethods: {
        signup: function(uname, pword, done) {
            //console.log("creating user " + uname);
            hash(pword, process.env.SALT, function(err, ret_hash){
                if (err) {done(err, null, {message: "bad hash"})}

                global.db.User.create({ username: uname.toLowerCase(), phash: ret_hash.toString('base64')})
                    .success(function(u){console.log(uname + " signed up")
                        done(null, u);})
                    .error(function(err){
                        console.log("got error on signup " + err.username[0])
                        done(err.username[0], null)
                    })
            })
        }},

        instanceMethods: {
                 validPassword: function(pword, answer) {
                     var myhash = this.phash;
                     var uname = this.username;
                     hash(pword, process.env.SALT, function (err, ret_hash) {
                        if (err) {return answer(false);}
                        if (ret_hash.toString('base64') != myhash) {
                            //console.log("expected " + myhash.toString('base64') + " \n got " + ret_hash.toString('base64'))
                            answer(false);
                     }
                     else {
                            console.log(uname + " authenticated / logged in")
                            return answer(true);
                     }});
              },
                 changepassword: function(p, callback){
                     console.log("old hash " + this.getDataValue('phash'))
                     usr=this;
                     hash(p, process.env.SALT, function(err, ret_hash){
                         if (err){
                             console.log("password change for user " + usr.username + " failed ")
                             callback(false)
                             return}
                         else {
                             console.log("password changed for " + usr.username)
                             usr.updateAttributes({phash: ret_hash.toString('base64')})
                             callback(true)
                             return
                         }
                     })
                 }}
        }
    )
}


