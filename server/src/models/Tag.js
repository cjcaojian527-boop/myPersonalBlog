// ============================================================
// 文件用途：标签模型（Tag）
// 文章标签，如"React"、"CSS"、"Node.js"等。
// 与 Article 是多对多关系，通过 article_tags 中间表关联。
// 多个文章可以使用同一个标签，一篇文章也可以有多个标签。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 标签名称
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,  // 标签名唯一
  },
  // 标签的 URL 别名，用于前端按标签筛选文章
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,  // slug 必须唯一
  },
}, {
  tableName: 'tags',  // 数据库表名
});

module.exports = Tag;
