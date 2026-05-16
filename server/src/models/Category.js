// ============================================================
// 文件用途：分类模型（Category）
// 文章的分类体系，如"前端"、"后端"、"设计"等。
// 每个分类下可以有多篇文章（一对多关系）。
// sortOrder 字段用于控制分类在前端导航中的显示顺序。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 分类名称，如"前端"、"后端"
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,  // 分类名称唯一，防止创建重复分类
  },
  // 分类的 URL 别名，英文或拼音形式，用于前端路由 /category/qian-duan
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,  // slug 也必须唯一
  },
  // 分类描述，可在分类页顶部显示
  description: {
    type: DataTypes.STRING(200),
  },
  // 排序权重，数字越小越靠前，用于控制导航栏中分类的展示顺序
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'categories',  // 数据库表名
});

module.exports = Category;
