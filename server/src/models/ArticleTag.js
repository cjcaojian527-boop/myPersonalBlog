// ============================================================
// 文件用途：文章-标签中间表模型（ArticleTag）
// 这是文章（Article）与标签（Tag）多对多关系的中间表（连接表）。
// 每条记录代表"某篇文章拥有某个标签"。
// 注意：timestamps: false 表示该表不需要 createdAt 和 updatedAt 时间戳字段，
//       因为中间表只是一个映射关系，不需要记录时间。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArticleTag = sequelize.define('ArticleTag', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 文章 ID（外键，关联 articles 表）
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 标签 ID（外键，关联 tags 表）
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'article_tags',  // 数据库表名
  timestamps: false,           // 【重要】关闭时间戳。
                               // 原因：中间表只表示"关联关系"，不需要记录创建/更新时间。
                               // 这覆盖了 database.js 全局配置中的 timestamps: true。
});

module.exports = ArticleTag;
