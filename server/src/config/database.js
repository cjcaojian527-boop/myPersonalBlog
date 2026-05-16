// ============================================================
// 文件用途：数据库连接配置
// 使用 Sequelize ORM 连接 MySQL 数据库，配置连接池和全局模型选项
// ============================================================

const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
  config.db.database,     // 数据库名称
  config.db.username,     // 数据库用户名
  config.db.password,     // 数据库密码
  {
    host: config.db.host,       // 数据库主机地址
    port: config.db.port,       // 数据库端口（MySQL 默认 3306）
    dialect: config.db.dialect, // 数据库方言，这里是 MySQL
    logging: false,             // 关闭 SQL 查询日志输出，避免控制台刷屏

    // 连接池配置：复用数据库连接，避免频繁创建/销毁连接带来的性能开销
    pool: {
      max: 5,         // 最大连接数，防止连接过多耗尽数据库资源
      min: 0,         // 最小连接数，空闲时保留的连接数
      acquire: 30000, // 获取连接的超时时间（毫秒），超时则报错
      idle: 10000,    // 连接空闲多久后自动释放（毫秒）
    },

    // 全局模型默认配置：所有通过此 sequelize 实例定义的模型都会继承这些选项
    define: {
      timestamps: true,  // 自动为每个模型添加 createdAt 和 updatedAt 字段
      underscored: true, // 将驼峰命名字段自动转为下划线命名（如 createdAt → created_at）
    },
  }
);

module.exports = sequelize;
