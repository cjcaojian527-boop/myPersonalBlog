// ============================================================
// 文件用途：评论模型（Comment）
// 存储文章评论，支持一级评论和回复（嵌套评论）。
// parentId: 指向父评论 ID，为 null 表示这是一条一级评论（直接在文章下）
// replyToUserId: 被回复的用户 ID，告知"此评论是回复给谁的"
// userId: 发表评论的用户
// articleId: 评论所属的文章
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 评论内容，TEXT 类型支持较长的文本
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // 所属文章 ID（外键，关联 articles 表）
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 评论发表者 ID（外键，关联 users 表）
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 父评论 ID：当此字段有值时，表示这是一条"回复"评论，指向被回复的评论
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,  // null 表示这是一条根评论（直接评论文章而非评论他人）
  },
  // 被回复用户的 ID：当回复某人的评论时，记录被回复人的用户 ID，方便前端显示"@某人"
  replyToUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,  // null 表示不是回复特定用户
  },
}, {
  tableName: 'comments',  // 数据库表名
});

module.exports = Comment;
