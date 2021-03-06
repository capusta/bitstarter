if (!global.hasOwnProperty('db')) {
    var Sequelize = require('sequelize');
    var sq = null;
    var fs = require('fs');
    var PGPASS_FILE = './.pgpass';
    if (process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME) {
        
        var user = process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME;
        var password = process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD;
        var host = process.env.OPENSHIFT_POSTGRESQL_DB_HOST;
        var port = process.env.OPENSHIFT_POSTGRESQL_DB_PORT;
        var dbname = process.env.PGDATABASE;

        var config =  {
            dialect:  'postgres',
            protocol: 'postgres',
            port:     port,
            host:     host,
            logging:  true, //false
            maxConcurrentQueries: 20,
            pool: { maxConnections: 20, maxIdleTime: 30}
        };
        sq = new Sequelize(dbname, user, password, config);
        module.exports = sq;
    } else {
        /* Local database
           We parse the .pgpass file for the connection string parameters.
        */
        var pgtokens = fs.readFileSync(PGPASS_FILE).toString().split(':');
        var host = pgtokens[0];
        var port = pgtokens[1];
        var dbname = pgtokens[2];
        var user = pgtokens[3];
        var password = pgtokens[4].trim();
        var config =  {
            dialect:  'postgres',
            protocol: 'postgres',
            port:     port,
            host:     host,
            logging:  false
        };
        var sq = new Sequelize(dbname, user, password, config);
    }
    global.sq = sq;
    global.db = {
        Sequelize: Sequelize,
        sequelize: sq,
        User: sq.import(__dirname + '/user'),
        Payment: sq.import(__dirname + '/payment'),
        Message: sq.import(__dirname + '/message'),
        Moneycard: sq.import(__dirname + '/moneycard')
    };

}
console.log("database  connected")
global.db.User.hasMany(global.db.Payment, {as: "Payments"});
global.db.User.hasMany(global.db.Message, {as: "Messeges"});
global.db.User.hasMany(global.db.Moneycard, {as: "Moneycards"});
global.db.Moneycard.belongsTo(global.db.User);
global.db.Payment.belongsTo(global.db.User);

module.exports = global.db;
exports.sq = sq;