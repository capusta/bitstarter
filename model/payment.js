
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Payment", {
      time: {type: DataTypes.STRING, allowNull: true, defaultValue: new Date().toISOString()},
      username: {type: DataTypes.STRING, allowNull: false, defaultValue:"unknown"},
      payment_ID: {type: DataTypes.STRING, allowNull: true, default: 0},
      amount: {type: DataTypes.INTEGER, allowNull:false, defaultValue: 0},
      refundstatus: {type: DataTypes.STRING, defaultValue: 'No',
          validate: {
              isIn: [['Yes', 'No']]
          }
      },
      productName: {type: DataTypes.STRING, allowNull: false, defaultValue:"Unknown Product"}
  });
};
