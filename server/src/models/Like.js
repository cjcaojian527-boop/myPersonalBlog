// ============================================================
// 文件用途：点赞模型（Like）
// 记录用户对文章的点赞行为。
// 每条记录表示"某个用户点赞了某篇文章"。
// 通过 article_id + user_id 联合唯一索引，确保同一用户不能重复点赞同一篇文章。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 被点赞的文章 ID（外键，关联 articles 表）
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 点赞的用户 ID（外键，关联 users 表）
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'likes',  // 数据库表名
  // indexes: 自定义索引配置
  indexes: [
    {
      unique: true,                                  // 唯一索引
      fields: ['article_id', 'user_id'],             // 联合索引字段：文章ID + 用户ID
      // 作用：防止同一用户对同一篇文章多次点赞。
      // 当用户尝试重复点赞时，数据库会直接拒绝（抛出唯一约束错误），
      // 比在应用层先查询再决定是否插入更加可靠和高效。
    },
  ],
});

module.exports = Like;
