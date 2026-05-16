// ============================================================
// 本文件定义了"验证码"相关的 API 路由
// ============================================================
const router = require('express').Router();
// captchaController: 验证码的控制器
const ctrl = require('../controllers/captchaController');

// -------------------- 公开路由 --------------------

// GET /generate  —— 公开访问，generate: 生成图形验证码（防止机器人/暴力破解）
router.get('/generate', ctrl.generate);

module.exports = router;
