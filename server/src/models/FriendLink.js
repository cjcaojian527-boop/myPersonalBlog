// ============================================================
// 文件用途：友链模型（FriendLink）
// 存储友情链接信息，用于在博客首页或侧边栏展示推荐的友邻站点。
// 包含站点名称、URL 地址和排序权重。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FriendLink = sequelize.define('FriendLink', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 友链站点名称，显示在链接文字上
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  // 友链 URL 地址，点击后跳转到对应站点
  url: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // 排序权重，数字越小越靠前，用于控制友链在前端的展示顺序
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'friend_links',  // 数据库表名
});

module.exports = FriendLink;
