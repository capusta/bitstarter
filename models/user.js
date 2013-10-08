var hash = require('../config/hash.js')

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("User", {
            username: {type: DataTypes.STRING, unique: true, allowNull: false},
            phash: {type: DataTypes.STRING(255), unique: true, allowNull: false},
            usertype: {type: DataTypes.STRING, allowNull: false, defaultValue: "user"},

            name: {type: DataTypes.STRING, allowNull: true, defaultValue: "Anon Smith"},
            addressOne: {type: DataTypes.STRING, allowNull: true, defaultValue: "123 Parkside Drive"},
            addressTwo: {type: DataTypes.STRING, allowNull: true, defaultValue: "San Francisco, CA, 94519"},
            email: {type: DataTypes.STRING, allowNull: true, defaultValue: "user@domain"},
            homeBTC: {type: DataTypes.STRING, allowNull: false, defaultValue: "1BTCorgHwCg6u2YSAWKgS17qUad6kHmtQW"}
    }, {
        classMethods: {
        signup: function(uname, pword, done) {
            //console.log("creating user " + uname);
            hash(pword, process.env.SALT, function(err, ret_hash){
                if (err) {done(err, null, {message: "bad hash"})}
                global.db.User.create({
                    username: uname.toLowerCase(),
                    phash: ret_hash.toString('base64')
                }).success(function(u){
                        console.log(uname + " signed up")
                        done(null, u);
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

                     }
                 });
              }}}
    )
}

