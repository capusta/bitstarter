
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Message", {
    time: {type: DataTypes.STRING, allowNull: true, defaultValue: new Date().toISOString()},
    to: {type: DataTypes.STRING, allowNull: false, defaultValue:"unknown"},
    from: {type: DataTypes.STRING, allowNull: false, defaultValue:"unknown"},
    message: {type: DataTypes.STRING(1024), allowNull: true}
  }, {
          classMethods: {
            addCard: function(type, cid, u){
                global.db.Message.create({to: u.username, from: "admin", message: "New "+type+"("
                    +cid+")"+" added !"})
                    .success(function(m){
                        u.addMessege(m);
                        u.alert = u.alert.concat('mc');
                        u.save();
                    })},
             sendMessege: function(from, to, m, callback){
                  global.db.Message.create({to: to, from: from, message: m}).success(function(m){
                     global.db.User.find({ where: {username: to}}).success(function(u){
                         if (u != null) {
                             u.addMessege(m);
                             u.alert = u.alert.concat('m');
                             u.save();
                             callback(true)
                         }
                         else {
                            callback(false)
                         }
                     })
                  })
              }
      }}

  );
};
