// ============================================================
// 本文件定义了"站点设置"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（管理员权限）
const auth = require('../middlewares/auth');
// settingController: 站点设置的控制器
const ctrl = require('../controllers/settingController');

// -------------------- 公开路由 --------------------

// GET /  —— 公开访问，get: 获取站点全局设置（如站点标题、Logo、SEO 信息等）
router.get('/', ctrl.get);

// -------------------- 需要认证的路由 --------------------

// PUT /  —— 需要登录，update: 更新站点全局设置
router.put('/', auth, ctrl.update);

module.exports = router;
