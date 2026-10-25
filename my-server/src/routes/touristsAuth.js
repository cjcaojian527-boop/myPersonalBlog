const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { Register, Login, queryUsers, updateUser, destroyUser } = require('../controllers/touristscontroller');

const { requireAdmin, verifyCaptcha, registerLimiter } = require('../Uses');


// const validation = [
//     body('password').isLength({ min: 6, max: 24 }).withMessage('密码长度至少为6位'),
//     body('email').isEmail({ min: 4 }).withMessage('请输入正确的邮箱地址'),
// ]

//注册（限流 → 验证码 → 业务）
router.post('/Register', registerLimiter, verifyCaptcha, Register);
router.post('/Login', Login);

router.post('/queryUsers', queryUsers);
router.post('/destroyUser', requireAdmin, destroyUser);
router.post('/updateUser', requireAdmin, updateUser);

module.exports = router;