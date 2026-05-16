// ============================================================
// 本文件定义了"评论"相关的 API 路由
// ============================================================
const router = require('express').Router();
// auth: 认证中间件，用于验证请求是否携带有效的登录凭证（需要登录才能发表/删除评论）
const auth = require('../middlewares/auth');
// commentController: 评论的控制器
const ctrl = require('../controllers/commentController');

// -------------------- 公开路由 --------------------

// GET /     —— 公开访问，list: 获取评论列表（通常按文章 ID 筛选某篇文章下的评论）
router.get('/', ctrl.list);

// -------------------- 需要认证的路由 --------------------

// POST /        —— 需要登录，create: 发表新评论
router.post('/', auth, ctrl.create);
// DELETE /:id   —— 需要登录，remove: 删除指定 ID 的评论（通常只有评论作者或管理员可删）
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
