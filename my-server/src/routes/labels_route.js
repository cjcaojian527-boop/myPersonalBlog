const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../Uses');
const { getLabels, addLabels, updateLabels, destroyLabels } = require('../controllers/labelcontroller');


//获取列表
router.post('/getLabels', getLabels);

router.post('/addLabels', requireAdmin, addLabels);

router.post('/updateLabels', requireAdmin, updateLabels);

router.post('/destroyLabels', requireAdmin, destroyLabels);


module.exports = router;