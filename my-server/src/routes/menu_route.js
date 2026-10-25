const express = require('express');
const router = express.Router();
const { requireAdmin, protectSeedMenu } = require('../Uses');
const { getMenus, addMenu, updateMenu, destroyMeun, queryMenus } = require('../controllers/menuController');


//获取菜单
router.get('/getMenus', getMenus);

router.post('/queryMenus', queryMenus);

router.post('/addMenu', requireAdmin, addMenu);

// 先验身份（requireAdmin），再验数据（protectSeedMenu），顺序不能反
router.post('/updateMenu', requireAdmin, protectSeedMenu, updateMenu);

router.post('/destroyMeun', requireAdmin, protectSeedMenu, destroyMeun);


module.exports = router;