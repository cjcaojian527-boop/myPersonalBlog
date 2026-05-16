// ============================================================
// 文件用途：关于页面模型（About）
// 存储"关于我"页面的 Markdown 内容。
// 通常只有一条记录，管理员可在后台编辑此页面内容。
// 内容支持 Markdown 格式，前端可渲染为丰富的排版效果。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const About = sequelize.define('About', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 关于页面的正文内容，Markdown 格式。LONGTEXT 支持超大文本
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
}, {
  tableName: 'about',  // 数据库表名，单数形式，因为通常只有一行数据
});

module.exports = About;
