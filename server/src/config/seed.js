// ============================================================
// 文件用途：数据库种子数据脚本
// 在首次启动时自动填充默认数据，包括：
//   1. 默认管理员账号（admin / admin123）
//   2. 默认文章分类（前端、后端、设计、生活、文学）
//   3. 默认标签（React、Vue、JavaScript 等）
//   4. 5 篇示例文章及评论
//   5. 默认站点设置（站点名称、描述、分页大小）
// 使用 findOrCreate 保证幂等性，重复执行不会创建重复数据
// ============================================================

const bcrypt = require('bcryptjs');
const { User, Category, Tag, Article, Setting, Like, Comment } = require('../models');

async function seed() {
  // ==================== 1. 创建默认管理员用户 ====================
  const adminCount = await User.count();  // 查询现有用户数
  let admin;
  if (adminCount === 0) {
    // 数据库中没有任何用户 → 创建默认管理员
    const hashed = await bcrypt.hash('admin123', 10);  // 用 bcrypt 加密密码，盐值轮数 10
    admin = await User.create({
      username: 'admin',
      password: hashed,
      nickname: '博主',
      role: 'admin',           // 角色为管理员，拥有全部权限
    });
    console.log('Default admin created: admin / admin123');
  } else {
    // 已有用户 → 查找现有管理员，后续示例文章将关联到该用户
    admin = await User.findOne({ where: { role: 'admin' } });
  }

  // ==================== 2. 创建默认文章分类 ====================
  // categoryNames: 预定义的五个分类
  const categoryNames = ['前端', '后端', '设计', '生活', '文学'];
  const categories = {};  // 用 name → category 对象的映射表，方便后续按名称获取分类 ID
  for (const name of categoryNames) {
    // findOrCreate: 如果分类已存在（按 name 查找）则返回已有记录，否则创建新记录
    const [cat] = await Category.findOrCreate({
      where: { name },
      defaults: {
        name,
        slug: name.toLowerCase(),                          // URL 友好的英文标识别，如"前端" → "qian duan"（这里用拼音会更合适，此处简化处理）
        sortOrder: categoryNames.indexOf(name),            // 排序顺序，按数组中的下标排列
      },
    });
    categories[name] = cat;
  }

  // ==================== 3. 创建默认标签 ====================
  const tagNames = ['React', 'Vue', 'JavaScript', 'Node.js', 'CSS', 'MySQL', 'Docker', 'Git', 'TypeScript', 'Vite'];
  const tags = {};  // name → tag 映射表
  for (const name of tagNames) {
    const [tag] = await Tag.findOrCreate({
      where: { name },
      defaults: { name, slug: name.toLowerCase() },
    });
    tags[name] = tag;
  }

  // ==================== 4. 创建示例文章 ====================
  const articleCount = await Article.count();
  if (articleCount === 0) {  // 仅在没有任何文章时才创建示例数据，避免重复
    // samples 数组定义了 5 篇示例文章的标题、摘要、正文等
    const samples = [
      {
          slug: 'react-19-vite-8-modern-frontend',
          title: '使用 React 19 + Vite 8 搭建现代前端项目',
        summary: '本文介绍如何使用最新的 React 19 和 Vite 8 搭建一个现代化的前端项目，包含完整的工程化配置。',
        // content 为完整的 Markdown 格式文章内容
        content: `# 使用 React 19 + Vite 8 搭建现代前端项目

## 前言

React 19 带来了许多令人兴奋的新特性，而 Vite 8 则提供了更快的构建速度。本文将介绍如何从零开始搭建一个现代化的前端项目。

## 创建项目

首先使用 Vite 创建项目：

\`\`\`bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
\`\`\`

## React 19 新特性

### use() Hook

React 19 引入了 \`use()\` Hook，可以直接在组件中读取 Promise 和 Context：

\`\`\`jsx
import { use } from 'react';

function Post({ postPromise }) {
  const post = use(postPromise);
  return <article>{post.title}</article>;
}
\`\`\`

### Server Components

React Server Components 允许组件在服务端渲染，减少客户端 JavaScript 体积。

## 配置 Vite

Vite 8 使用 Rust 编译，速度比之前快了 10 倍以上。配置文件支持 ESM：

\`\`\`js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
\`\`\`

## 结语

React 19 + Vite 8 是目前最先进的前端开发组合，推荐大家尝试。`,
        status: 'published',
        categoryId: categories['前端'].id,  // 关联到"前端"分类
        viewCount: 256,
        likeCount: 32,
        isTop: true,                        // 标记为置顶文章
      },
      {
          slug: 'nodejs-express-sequelize-backend',
          title: 'Node.js + Express + Sequelize 后端开发实战',
        summary: '从零开始搭建一个基于 Express 和 Sequelize 的 RESTful API 后端服务，包含认证、中间件和错误处理。',
        content: `# Node.js + Express + Sequelize 后端开发实战

## 技术选型

- **Express**: 轻量级 Node.js Web 框架
- **Sequelize**: 强大的 Node.js ORM
- **MySQL 8**: 关系型数据库
- **JWT**: 无状态用户认证

## 项目结构

\`\`\`
server/
  src/
    models/        # 数据模型
    routes/        # 路由定义
    controllers/   # 控制器
    middlewares/   # 中间件
    config/        # 配置文件
  .env            # 环境变量
\`\`\`

## 模型定义

使用 Sequelize 定义用户模型：

\`\`\`js
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  underscored: true,
});
\`\`\`

## JWT 认证中间件

\`\`\`js
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未登录' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'Token 无效' });
  }
}
\`\`\`

## 总结

Express + Sequelize 是 Node.js 后端开发的主流选择，配合 JWT 认证可以快速构建安全的 API 服务。`,
        status: 'published',
        categoryId: categories['后端'].id,  // 关联到"后端"分类
        viewCount: 189,
        likeCount: 28,
      },
      {
          slug: 'css-modern-layout-flexbox-grid',
          title: 'CSS 现代布局完全指南：Flexbox 与 Grid',
        summary: '深入理解 Flexbox 和 CSS Grid 布局的核心概念，包含大量实战示例和最佳实践。',
        content: `# CSS 现代布局完全指南

## Flexbox 核心概念

Flexbox 是一维布局模型，用于在行或列中排列元素。

### 容器属性

\`\`\`css
.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\`

### 项目属性

\`\`\`css
.item {
  flex: 1;           /* flex-grow */
  flex-shrink: 0;
  align-self: flex-start;
}
\`\`\`

## CSS Grid 布局

Grid 是二维布局系统：

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 24px;
}

.header {
  grid-column: 1 / -1;        /* 占据整行 */
}

.sidebar {
  grid-row: 2 / 4;            /* 跨越多行 */
}
\`\`\`

## 实战：博客布局

\`\`\`css
.blog-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
\`\`\`

掌握 Flexbox 和 Grid 后，几乎所有布局需求都能轻松应对。`,
        status: 'published',
        categoryId: categories['前端'].id,
        viewCount: 412,
        likeCount: 56,
        isTop: true,
      },
      {
          slug: 'mysql-8-performance-optimization',
          title: 'MySQL 8 性能优化实践',
        summary: '分享 MySQL 8 在实际项目中的性能优化经验，包括索引优化、查询优化和配置调优。',
        content: `# MySQL 8 性能优化实践

## 索引优化

### 覆盖索引

将查询需要的字段全部包含在索引中，避免回表：

\`\`\`sql
CREATE INDEX idx_articles_status_time ON articles(status, created_at);
\`\`\`

### 联合索引最左前缀原则

\`\`\`sql
-- 创建联合索引
CREATE INDEX idx_user_action ON logs(user_id, action, created_at);

-- 这些查询可以使用索引
SELECT * FROM logs WHERE user_id = 1;
SELECT * FROM logs WHERE user_id = 1 AND action = 'login';

-- 这个查询无法使用索引
SELECT * FROM logs WHERE action = 'login';
\`\`\`

## 查询优化

### 避免 SELECT *

只查询需要的字段，减少数据传输和内存占用。

### 使用 EXPLAIN 分析

\`\`\`sql
EXPLAIN SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 10;
\`\`\`

关注 \`type\` 列，从好到差：system > const > eq_ref > ref > range > index > ALL。

## 配置调优

\`\`\`ini
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
max_connections = 500
\`\`\`

## 总结

数据库优化是一个持续的过程，需要结合业务场景不断调整。`,
        status: 'published',
        categoryId: categories['后端'].id,
        viewCount: 178,
        likeCount: 21,
      },
      {
          slug: 'git-workflow-best-practices',
          title: 'Git 工作流最佳实践',
        summary: '团队协作中 Git 工作流的规范与实践，包括分支管理、提交规范和 Code Review 流程。',
        content: `# Git 工作流最佳实践

## 分支策略

采用 GitFlow 简化版：

\`\`\`
main        # 生产分支
  └── develop    # 开发分支
       ├── feature/xxx  # 功能分支
       ├── fix/xxx      # 修复分支
       └── hotfix/xxx   # 紧急修复
\`\`\`

## 提交规范

使用 Conventional Commits：

\`\`\`
feat: 添加文章搜索功能
fix: 修复登录页面样式错乱
docs: 更新 README 文档
refactor: 重构用户认证模块
\`\`\`

## 常用命令

\`\`\`bash
# 创建功能分支
git checkout -b feature/article-editor develop

# 合并到开发分支
git checkout develop
git merge --no-ff feature/article-editor

# 交互式 rebase 整理提交
git rebase -i HEAD~3
\`\`\`

## Code Review

每个 PR 至少需要一人 Review 通过后才能合并。关注代码逻辑、性能和安全问题。

良好的 Git 习惯能大幅提升团队协作效率。`,
        status: 'published',
        categoryId: categories['前端'].id,
        viewCount: 134,
        likeCount: 18,
      },
    ];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      // 创建文章记录，每篇文章的发布时间依次递减一天（86400000 毫秒 = 1 天）
      const article = await Article.create({
        title: s.title,
        summary: s.summary,
        content: s.content,
        status: s.status,
        categoryId: s.categoryId,
        authorId: admin.id,                          // 作者设为管理员用户
        viewCount: s.viewCount,
        likeCount: s.likeCount,
        isTop: s.isTop || false,
        publishedAt: new Date(Date.now() - (samples.length - i) * 86400000),
      });

      //  为每篇文章关联对应的标签（多对多关系）
      // articleTagMap[i] 定义了每篇文章应该关联哪些标签
      const articleTagMap = [
        ['React', 'JavaScript', 'Vite', 'TypeScript'],
        ['Node.js', 'MySQL', 'Docker'],
        ['CSS', 'React', 'Vue'],
        ['MySQL', 'Docker'],
        ['Git', 'TypeScript'],
      ];
      const tagNamesForArticle = articleTagMap[i] || [];
      const tagInstances = tagNamesForArticle.map(name => tags[name]).filter(Boolean);  // filter(Boolean) 过滤掉不存在的标签
      if (tagInstances.length > 0) {
        // setTags() 是 Sequelize 多对多关联提供的方法，自动维护 article_tags 中间表
        await article.setTags(tagInstances);
      }

      //  为每篇文章添加一条管理员评论，营造社区活跃的假象
      await Comment.create({
        content: '写得很好，学习了！期待更多这样的文章。',
        articleId: article.id,
        userId: admin.id,
        status: 'approved',
      });
    }
    console.log('Sample articles and comments created.');
  }

  // ==================== 5. 创建默认站点设置 ====================
  const defaults = [
    { key: 'site_name', value: 'PersonalBlog' },              // 站点名称，显示在页面标题栏
    { key: 'site_description', value: '一个全栈技术博客' },    // 站点描述，用于 SEO 和页面介绍
    { key: 'page_size', value: '10' },                        // 文章列表每页显示数量
  ];
  for (const s of defaults) {
    // findOrCreate 保证幂等：如果该 key 已经存在则不做任何操作
    await Setting.findOrCreate({ where: { key: s.key }, defaults: s });
  }
}

module.exports = seed;
