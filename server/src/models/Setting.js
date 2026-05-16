// ============================================================
// 文件用途：站点设置模型（Setting）
// 以键值对（Key-Value）的形式存储博客系统的各项配置参数。
// 相比硬编码在代码中，这种方式的优势：
//   1. 管理员可在后台动态修改，无需重启服务
//   2. 可扩展性强，新增配置项只需插入一条记录即可
// 示例：site_name（站点名称）、site_description（站点描述）、page_size（分页数量）
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 配置项的键名，如 "site_name"、"page_size"
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,  // key 必须唯一，避免同一配置项出现多条记录
  },
  // 配置项的值，TEXT 类型支持任意长度的文字
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'settings',  // 数据库表名
});

module.exports = Setting;
