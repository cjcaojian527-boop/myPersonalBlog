const express = require('express');
const router = express.Router();
const { getSiteStats } = require('../controllers/statsController');
const { getDashboard } = require('../controllers/dashboardcontroller');
// const { requireAdmin } = require('../Uses');

// 获取站点统计信息（前台展示用，已在白名单中免登录）
router.get('/getSiteStats', getSiteStats);

// 数据大屏：一次性返回全部统计数据（后台功能，需要管理员权限）
router.post('/getDashboard', getDashboard);

module.exports = router;
