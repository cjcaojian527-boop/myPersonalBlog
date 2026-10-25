const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../Uses');
const { getList, addType, updateType, destroyType, queryTypes } = require('../controllers/articleTypecontroller');


router.get("/getList", getList);
router.post("/queryTypes", queryTypes);
router.post("/addType", requireAdmin, addType);

router.post("/updateType", requireAdmin, updateType);

router.post("/destroyType", requireAdmin, destroyType);

module.exports = router;