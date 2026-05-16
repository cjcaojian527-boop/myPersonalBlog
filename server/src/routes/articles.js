// ============================================================
// 本文件定义了"文章"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（管理员权限）
const auth = require('../middlewares/auth');
// articleController: 文章的控制器
const ctrl = require('../controllers/articleController');

// -------------------- 公开路由 --------------------

// GET /          —— 公开访问，list: 获取文章列表（支持分页、筛选）
router.get('/', ctrl.list);
// GET /search    —— 公开访问，search: 根据关键词搜索文章
router.get('/search', ctrl.search);
// GET /archive   —— 公开访问，archive: 获取文章归档（按时间分组）
router.get('/archive', ctrl.archive);
// GET /:id       —— 公开访问，detail: 获取单篇文章的详细信息（不含浏览量自增）
router.get('/:id', ctrl.detail);
// PUT /:id/view  —— 公开访问，view: 浏览量 +1（单独接口，前端控制调用时机防止重复）
router.put('/:id/view', ctrl.view);

// -------------------- 需要认证的路由 --------------------

// POST /         —— 需要登录，create: 创建新文章
router.post('/', auth, ctrl.create);
// PUT /:id       —— 需要登录，update: 更新指定 ID 的文章
router.put('/:id', auth, ctrl.update);
// DELETE /:id    —— 需要登录，remove: 删除指定 ID 的文章
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
