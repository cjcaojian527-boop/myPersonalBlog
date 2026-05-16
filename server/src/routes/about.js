// ============================================================
// 本文件定义了"关于页面"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证
const auth = require('../middlewares/auth');
// aboutController: 关于页面的控制器
const ctrl = require('../controllers/aboutController');

// -------------------- 公开路由 --------------------

// GET /  —— 公开访问，获取"关于"页面的内容（如个人简介）
router.get('/', ctrl.get);

// -------------------- 需要认证的路由 --------------------

// PUT /  —— 需要登录（管理员），更新"关于"页面的内容
router.put('/', auth, ctrl.update);

module.exports = router;
