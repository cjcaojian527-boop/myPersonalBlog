const router = require('express').Router();
const { getList, add, update, destroy } = require('../controllers/artclecontroller')
const { requireTempUser } = require('../Uses');

router.post('/getList', getList);

router.post('/add', requireTempUser, add);

router.post('/update', requireTempUser, update);

router.get('/destroy', destroy);


module.exports = router;
