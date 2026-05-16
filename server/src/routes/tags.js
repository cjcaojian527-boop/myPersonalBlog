// ============================================================
// 本文件定义了"标签"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（管理员权限）
const auth = require('../middlewares/auth');
// tagController: 标签的控制器
const ctrl = require('../controllers/tagController');

// -------------------- 公开路由 --------------------

// GET /     —— 公开访问，list: 获取所有标签列表（供前端展示云标签或筛选文章）
router.get('/', ctrl.list);

// -------------------- 需要认证的路由 --------------------

// POST /        —— 需要登录，create: 创建新标签
router.post('/', auth, ctrl.create);
// DELETE /:id   —— 需要登录，remove: 删除指定 ID 的标签
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
