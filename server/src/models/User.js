// ============================================================
// 文件用途：用户模型（User）
// 存储博客系统的用户信息，支持管理员（admin）和普通用户（user）两种角色。
// 管理员拥有全部管理权限（发布文章、审核评论、修改设置等）；
// 普通用户可以浏览文章和发表评论。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 用户名，最大 50 个字符
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,  // 不允许为空
    unique: true,      // 必须唯一，数据库中会创建唯一索引，防止重名
  },
  // 用户密码，存储 bcrypt 加密后的密文（最长 255 字符），不存明文
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // 用户昵称，显示在前端页面（如文章署名、评论区展示）
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '博主',  // 默认昵称，与角色无关，昵称可自定义
  },
  // 头像 URL 地址，存储图片路径
  avatar: {
    type: DataTypes.STRING(255),
  },
  // 用户角色：admin（管理员）或 user（普通用户）
  role: {
    type: DataTypes.ENUM('admin', 'user'),  // ENUM 枚举类型，数据库层面约束了取值只能是这两个值之一
    defaultValue: 'user',                    // 新注册用户默认为普通用户
  },
}, {
  tableName: 'users',  // 指定数据库中的表名（Sequelize 默认会用复数 User → Users，这里显式指定更清晰）
  // 继承自 database.js 全局配置：timestamps: true → 自动维护 created_at 和 updated_at 字段
  // 继承自 database.js 全局配置：underscored: true → createdAt 字段在数据库中为 created_at
});

module.exports = User;
