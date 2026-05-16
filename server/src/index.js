/**
 * ============================================================
 * 文件名: index.js
 * 用途: 博客系统后端应用入口文件
 *
 * 本文件负责整个 Express 应用的初始化工作，包括：
 * 1. 加载环境变量和项目配置
 * 2. 创建 Express 应用实例
 * 3. 注册全局中间件（CORS、JSON 解析、静态文件等）
 * 4. 注册所有 API 路由（共 11 个模块）
 * 5. 注册全局错误处理中间件
 * 6. 定义启动函数 start()：依次执行数据库连接 → 表结构同步 → 种子数据初始化 → 启动 HTTP 服务
 *
 * 启动流程: node src/index.js → 自动调用 start()
 * ============================================================
 */

// ==================== 第一阶段：加载核心依赖 ====================

const express = require('express');     // Express Web 框架，用于构建 HTTP 服务
const cors = require('cors');           // CORS 中间件，处理跨域请求
const path = require('path');           // Node.js 内置路径处理模块
require('dotenv').config();             // 加载 .env 文件中的环境变量到 process.env

// ==================== 第二阶段：加载项目内部模块 ====================

const sequelize = require('./config/database');  // Sequelize 数据库连接实例（ORM，连接 MySQL）
const config = require('./config');              // 项目全局配置（端口号、JWT 密钥、上传限制等）
const seed = require('./config/seed');           // 种子数据脚本（用于初始化数据库中的默认数据）
const { ensureBucket } = require('./config/minio'); // MinIO 桶初始化

// ==================== 第三阶段：加载路由模块 ====================

const authRoutes = require('./routes/auth');         // 认证路由：登录、注册、token 刷新
const articleRoutes = require('./routes/articles');  // 文章路由：文章的增删改查
const categoryRoutes = require('./routes/categories'); // 分类路由：文章分类管理
const tagRoutes = require('./routes/tags');          // 标签路由：文章标签管理
const commentRoutes = require('./routes/comments');  // 评论路由：文章评论管理
const likeRoutes = require('./routes/likes');        // 点赞路由：点赞/取消点赞
const linkRoutes = require('./routes/links');        // 友链路由：友情链接管理
const settingRoutes = require('./routes/settings');  // 设置路由：博客全局设置
const aboutRoutes = require('./routes/about');       // 关于路由：关于页面内容
const captchaRoutes = require('./routes/captcha');   // 验证码路由：生成图形验证码
const uploadRoutes = require('./routes/upload');     // 上传路由：文件上传（图片等）

// ==================== 第四阶段：Express 初始化 ====================

const app = express();  // 创建 Express 应用实例，整个服务以此为核心

// ==================== 第五阶段：全局中间件注册 ====================

app.use(cors());  // 启用 CORS，允许前端（不同域名/端口）访问后端接口

// 解析 JSON 格式的请求体，limit: '10mb' 限制请求体最大 10MB（防止大文件攻击）
app.use(express.json({ limit: '10mb' }));

// 解析 URL 编码格式的请求体（如表单提交），extended: true 支持嵌套对象
app.use(express.urlencoded({ extended: true }));

// ==================== 第六阶段：API 路由注册 ====================

// 所有 API 路由统一以 /api 为前缀，按功能模块划分
app.use('/api/auth', authRoutes);           // 认证相关：POST /api/auth/login, /api/auth/register
app.use('/api/articles', articleRoutes);    // 文章相关：GET/POST /api/articles 等
app.use('/api/categories', categoryRoutes); // 分类相关：GET/POST /api/categories 等
app.use('/api/tags', tagRoutes);            // 标签相关
app.use('/api/comments', commentRoutes);    // 评论相关
app.use('/api/likes', likeRoutes);          // 点赞相关
app.use('/api/links', linkRoutes);          // 友链相关
app.use('/api/settings', settingRoutes);    // 设置相关
app.use('/api/about', aboutRoutes);         // 关于页面
app.use('/api/captcha', captchaRoutes);     // 验证码生成
app.use('/api/upload', uploadRoutes);       // 文件上传

// ==================== 第七阶段：全局错误处理中间件 ====================

// 这是一个 Express 错误处理中间件（注意它有 4 个参数: err, req, res, next）
// Express 通过参数个数自动识别它为错误处理中间件
// 作用: 捕获所有路由中抛出的未处理异常，统一返回 500 错误，避免服务器崩溃
// 同时在控制台打印错误堆栈，方便开发调试
app.use((err, req, res, next) => {
  console.error(err.stack);  // 打印完整的错误调用栈，便于排查问题
  res.status(500).json({ message: '服务器内部错误' });  // 向前端返回友好的错误信息
});

// ==================== 第八阶段：启动函数 ====================

/**
 * start() - 服务器启动主函数
 *
 * 按顺序执行以下步骤，任一步骤失败都会终止进程：
 * 第 1 步: sequelize.authenticate()
 *   - 含义: 测试数据库连接是否正常（使用 Sequelize ORM 连接 MySQL）
 *   - 成功则输出 "Database connected."
 *
 * 第 2 步: sequelize.sync({ alter: true })
 *   - 含义: 数据库表结构同步
 *   - alter: true 表示自动对比模型定义和实际表结构，只修改差异部分（不会丢数据）
 *   - 首次运行时，会自动创建所有表；模型字段变更时，会自动修改表结构
 *   - 这是 Sequelize ORM 的特色功能，让开发者无需手动写 SQL 建表
 *
 * 第 3 步: seed()
 *   - 含义: 种子数据初始化
 *   - 当数据库表为空时，自动插入默认数据（如默认管理员账号、默认分类等）
 *   - 确保系统在首次启动后就有可用的基础数据
 *
 * 第 4 步: app.listen(config.port, callback)
 *   - 含义: 启动 HTTP 服务器，监听指定端口
 *   - config.port 来自配置文件，默认通常是 3000
 *   - 启动成功后输出可访问的地址
 *
 * 错误处理:
 *   - 如果任何步骤失败，输出错误信息并以退出码 1 终止进程
 *   - process.exit(1) 确保 PM2 等进程管理工具能检测到启动失败，进行自动重启
 */
async function start() {
  try {
    // 第 1 步：测试数据库连接
    await sequelize.authenticate();
    console.log('Database connected.');

    // 第 2 步：同步数据库表结构（根据模型自动创建/更新表）
    await sequelize.sync();
    console.log('Database synced.');

    // 第 3 步：初始化 MinIO 桶（确保桶存在并设置公开读策略）
    try {
      await ensureBucket();
      console.log('MinIO bucket ready.');
    } catch (minioErr) {
      console.warn('MinIO not available, file upload will fail:', minioErr.message);
    }

    // 第 4 步：初始化种子数据（默认管理员账户、默认分类等）
    await seed();
    console.log('Seed data initialized.');

    // 第 5 步：启动 HTTP 服务，监听端口
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
    });
  } catch (err) {
    // 启动过程中任何一步失败，打印错误并退出进程
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// ==================== 执行启动 ====================

start();  // 调用启动函数，开始整个应用的初始化流程
