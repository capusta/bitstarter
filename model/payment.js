
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Payment", {
      time: {type: DataTypes.STRING, allowNull: true, defaultValue: new Date().toISOString(),
        validate: {
            isDate: true
        }
      },
      username: {type: DataTypes.STRING, allowNull: false, defaultValue:"admin",
          validate: {
              isAlphanumeric: true,
              len: [4,20]
          }
      },
      payment_ID: {type: DataTypes.STRING, allowNull: true, default: "00aa",
          validate: {
              isAlphanumeric: true,
              len: [4,20]
          }
      },
      amount: {type: DataTypes.INTEGER, allowNull:false, defaultValue: 0},
      refundstatus: {type: DataTypes.STRING, defaultValue: 'No',
          validate: {
              isIn: [['Yes', 'No', 'NA']]
          }
      },
      refundedAmount: {type: DataTypes.INTEGER, allowNull: false, defaultValue:0},
      productName: {type: DataTypes.STRING, allowNull: false, defaultValue:"Unknown Product",
        validate: {
            len: [4,20]
        }
      },
      // Will be used for archiving purposes when users delete their account.
      archived: {type: DataTypes.BOOLEAN, allowNull:false, defaultValue: false},
      refundHash: {type: DataTypes.STRING, allowNull:true,
          isAlphanumeric: true,
          len: [10,200]
      }
  });
};
