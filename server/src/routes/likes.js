// ============================================================
// 本文件定义了"点赞"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（需要登录才能点赞）
const auth = require('../middlewares/auth');
// likeController: 点赞的控制器
const ctrl = require('../controllers/likeController');

// -------------------- 需要认证的路由 --------------------

// POST /toggle  —— 需要登录，toggle: 切换点赞状态（已点赞则取消，未点赞则点赞）
router.post('/toggle', auth, ctrl.toggle);
// GET /status   —— 需要登录，status: 查询用户对某个资源的点赞状态
router.get('/status', auth, ctrl.status);

module.exports = router;
