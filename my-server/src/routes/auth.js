const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { Register, Login, captcha, verifyCode, queryUsers, updateUser, destroyUser } = require('../controllers/authcontroller');
const { requireAdmin, decryptSM2 } = require('../Uses');
// const TimeLog = (req, res, next) => {
//     console.log('[times]:', new Date().toLocaleString('zh-CN'))
//     next();
// }

// router.use(TimeLog);



const validation = [
    // body('password').isLength({ min: 6, max: 24 }).withMessage('密码长度至少为6位'),
    // body('name').isLength({ min: 4 }).withMessage('账号长度至少为4位'),
]

//注册
router.post('/Register', validation, decryptSM2, Register);
router.post('/Login', validation, decryptSM2, Login);

router.get('/getCaptchaCode', captcha);
router.post('/verifyCode', verifyCode);

router.post('/queryUsers', queryUsers);
router.post('/destroyUser', requireAdmin, destroyUser);
router.post('/updateUser', requireAdmin, updateUser);

module.exports = router;