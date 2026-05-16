// ============================================================
// 文件用途：文章模型（Article）
// 博客系统的核心模型，存储每篇文章的完整信息。
// 包括标题、正文、摘要、封面图、状态、阅读量、点赞数等。
// 与 Category（分类）、User（作者）、Tag（标签）、Comment（评论）存在关联关系。
// ============================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
  // 主键 ID，自增整数
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // 文章标题，最大 200 个字符
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  // URL 别名（slug），用于生成友好的文章访问链接，如 /article/react-19-vite-guide
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,  // 唯一约束，保证 URL 不会重复
  },
  // 文章摘要，显示在列表页，给读者一个快速的预览
  summary: {
    type: DataTypes.STRING(500),
  },
  // 文章正文，Markdown 格式存储。TEXT('long') 对应 MySQL 的 LONGTEXT 类型，支持超大文本
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  // 封面图片 URL
  coverImage: {
    type: DataTypes.STRING(255),
  },
  // 文章状态：draft（草稿，仅作者可见）或 published（已发布，公开可见）
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft',
  },
  // 浏览次数，每次访问文章详情时 +1
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // 点赞数，供前端快速展示，实际通过 likes 表保证数据一致性
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // 分类 ID（外键，关联 categories 表），每篇文章必须归属一个分类
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 作者 ID（外键，关联 users 表），记录文章的发布者
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 是否置顶，置顶文章在列表页排在最前面
  isTop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // 发布时间，草稿可以为空，已发布时记录发布时间
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'articles',
  hooks: {
    // beforeValidate：在数据验证之前自动生成 slug，确保验证时 slug 不为空
    beforeValidate(article) {
      if (!article.slug && article.title) {
        article.slug = article.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          || `article-${Date.now()}`;
      }
    },
  },
});

module.exports = Article;
