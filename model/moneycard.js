
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Moneycard", {
      cardID: {type: DataTypes.STRING, allowNull: false, defaultValue:0,
        validate: {
            isAlphanumeric: true,
            len: [4,20]
        }      },
      cardLR: {type: DataTypes.STRING, allowNull: false, defaultValue:0,
        validate: {
            isAlphanumeric: true,
            len: [4,20]
        }
      },
      type: {type: DataTypes.STRING, allowNull: true,
        validate: {
            isAlphanumeric: true,
            len: [4,20]
        }
      },
      condition: {type: DataTypes.STRING, allowNull: true,
        validate: {
            isAlphanumeric: true,
            len: [4,20]
        }
      },
      amount: {type: DataTypes.INTEGER, allowNull: true, defaultValue:0},
      // will be used for archiving purposes when users delete their accounts.
      archived: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
  });
};
