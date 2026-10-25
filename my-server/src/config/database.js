const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2/promise');
const { port, db } = require('./index');
// console.log("db:",db);

const DB = new Sequelize(db.database, db.username, db.password, {
    host: db.host,
    port: db.port,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    timezone: '+08:00',
    define: {
        timestamps: true,
        underscored: false
    },
    // logging: console.log,
});

// 自动建库：先不指定数据库连接，创建数据库后再交给 Sequelize
async function ensureDatabase() {
    const connection = await mysql2.createConnection({
        host: db.host,
        port: db.port,
        user: db.username,
        password: db.password
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db.database}\``);
    await connection.end();
}

module.exports = { DB, ensureDatabase };
