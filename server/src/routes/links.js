// ============================================================
// 本文件定义了"友情链接（友链）"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（管理员权限）
const auth = require('../middlewares/auth');
// linkController: 友链的控制器
const ctrl = require('../controllers/linkController');

// -------------------- 公开路由 --------------------

// GET /     —— 公开访问，list: 获取所有友链列表（供前端展示）
router.get('/', ctrl.list);

// -------------------- 需要认证的路由 --------------------

// POST /        —— 需要登录，create: 添加新友链
router.post('/', auth, ctrl.create);
// PUT /:id      —— 需要登录，update: 更新指定 ID 的友链信息
router.put('/:id', auth, ctrl.update);
// DELETE /:id   —— 需要登录，remove: 删除指定 ID 的友链
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
