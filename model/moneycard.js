
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Moneycard", {
      cardID: {type: DataTypes.STRING, allowNull: false, defaultValue:0},
      cardLR: {type: DataTypes.STRING, allowNull: false, defaultValue:0},
      type: {type: DataTypes.STRING, allowNull: true},
      condition: {type: DataTypes.STRING, allowNull: true},
      amount: {type: DataTypes.INTEGER, allowNull: true, defaultValue:0},
      // will be used for archiving purposes when users delete their accounts.
      archived: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
  });
};
