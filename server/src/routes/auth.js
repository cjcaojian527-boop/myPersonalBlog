// ============================================================
// 本文件定义了"用户认证（登录/注册）"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证
const auth = require('../middlewares/auth');
// authController: 认证的控制器
const ctrl = require('../controllers/authController');

// -------------------- 公开路由（无需登录） --------------------

// POST /register  —— 公开访问，register: 用户注册（创建新账号）
router.post('/register', ctrl.register);
// POST /login     —— 公开访问，login: 用户登录（验证凭证，返回 token）
router.post('/login', ctrl.login);

// -------------------- 需要认证的路由 --------------------

// GET /me         —— 需要登录，me: 获取当前登录用户的信息
router.get('/me', auth, ctrl.me);
// PUT /profile    —— 需要登录，updateProfile: 更新当前用户的个人资料
router.put('/profile', auth, ctrl.updateProfile);

module.exports = router;
