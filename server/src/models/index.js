// ============================================================
// 文件用途：模型关联关系统一声明文件
// 所有数据模型之间的关联关系（一对多、多对多、属于）都在此文件中集中定义。
// 这样做的好处：
//   1. 避免循环引用（每个模型文件定义关联时互相 require 导致死循环）
//   2. 关联关系一目了然，便于维护和理解数据表之间的关系
//   3. 修改关联时只需改这一个文件
// ============================================================

const User = require('./User');
const Article = require('./Article');
const Category = require('./Category');
const Tag = require('./Tag');
const ArticleTag = require('./ArticleTag');
const Comment = require('./Comment');
const Like = require('./Like');
const FriendLink = require('./FriendLink');
const Setting = require('./Setting');
const About = require('./About');

// ----------------------------------------------------------
// 分类 ↔ 文章（一对多 / 多对一）
//   hasMany: 一个分类下有多篇文章
//   belongsTo: 每篇文章归属一个分类
//   外键 categoryId 存储在 Article 表中
Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });    // 通过 Category 查询时可用 .getArticles() 获取关联文章
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });  // 通过 Article 查询时可用 .getCategory() 获取所属分类

// ----------------------------------------------------------
// 用户 ↔ 文章（一对多 / 多对一）
//   hasMany: 一个用户可以发表多篇文章
//   belongsTo: 每篇文章有一个作者
//   外键 authorId 存储在 Article 表中
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });          // 通过 User 查询时可 .getArticles() 获取该用户的所有文章
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });          // 通过 Article 查询时可 .getAuthor() 获取文章作者信息

// ----------------------------------------------------------
// 文章 ↔ 标签（多对多）
//   belongsToMany: 一篇文章可以有多个标签，一个标签可以被多篇文章使用
//   through: ArticleTag —— 指定中间表（也称"连接表"），用于存储 articleId ↔ tagId 的映射
//   foreignKey: 中间表中指向当前模型的外键
//   otherKey: 中间表中指向对方模型的外键
//   查询时可通过 article.getTags() 获取标签列表，或 tag.getArticles() 获取使用该标签的文章列表
Article.belongsToMany(Tag, { through: ArticleTag, foreignKey: 'articleId', otherKey: 'tagId', as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, foreignKey: 'tagId', otherKey: 'articleId', as: 'articles' });

// ----------------------------------------------------------
// 文章 ↔ 评论（一对多 / 多对一）
//   一篇文章可以有多个评论，每个评论属于一篇文章
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });       // 通过 Article 查询时可 .getComments() 获取文章所有评论
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });     // 通过 Comment 查询时可 .getArticle() 获取评论所属文章

// ----------------------------------------------------------
// 用户 ↔ 评论（一对多 / 多对一）
//   一个用户可以发表多条评论
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });            // 通过 User 查询时可 .getComments() 获取该用户所有评论
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });              // 通过 Comment 查询时可 .getUser() 获取评论发表者

// Comment → User（回复目标用户）
//   当评论是"回复某人"时，replyToUserId 指向被回复的用户
Comment.belongsTo(User, { foreignKey: 'replyToUserId', as: 'replyToUser' });// 通过 Comment 查询时可 .getReplyToUser() 获取被回复的用户信息

// ----------------------------------------------------------
// 文章 ↔ 点赞（一对多 / 多对一）
// 用户 ↔ 点赞（一对多 / 多对一）
//   Like 表同时关联 Article 和 User，记录"哪个用户点赞了哪篇文章"
Article.hasMany(Like, { foreignKey: 'articleId', as: 'likes' });            // 通过 Article 查询时可 .getLikes() 获取文章所有点赞
Like.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });        // 通过 Like 查询时可 .getArticle() 获取被点赞的文章
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });                  // 通过 User 查询时可 .getLikes() 获取该用户的所有点赞
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });                 // 通过 Like 查询时可 .getUser() 获取点赞的用户

// 统一导出所有模型，外部只需 require('../models') 即可使用所有模型
module.exports = {
  User, Article, Category, Tag, ArticleTag,
  Comment, Like, FriendLink, Setting, About,
};
