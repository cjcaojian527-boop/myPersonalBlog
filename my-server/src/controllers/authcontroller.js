const { Op, Sequelize } = require('sequelize');
const User = require('../models/User');
const Article = require('../models/ArticleList');
const Comments = require('../models/Comment');
const TouristsUser = require('../models/touristsUser');
const { body, validationResult } = require('express-validator');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
const { minioClient } = require('../services/minio');
const { jwtInfo } = require('../config');
const svgCaptcha = require('svg-captcha');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // bcryptjs：用于密码加盐哈希，保护用户密码安全



//高级查询用户
exports.queryUsers = async (req, res) => {

    const { formData: { createdAt, name, name_display, password, isSystem, role }, page = 1, pageSize = 10 } = req.body;

    // 构建查询条件
    const where = {};
    if (name !== undefined) {
        where.name = { [Op.like]: `%${name}%` };
    }
    if (name_display !== undefined) {
        where.name_display = { [Op.like]: `%${name_display}%` };
    }
    if (password !== undefined) {
        where.password = { [Op.eq]: password };
    }
    if (isSystem !== undefined) {
        where.isSystem = { [Op.eq]: isSystem };
    }
    if (role !== undefined) {
        where.role = { [Op.eq]: role };
    }

    if (createdAt && Array.isArray(createdAt) && createdAt.length == 2) {
        where.createdAt = { [Op.between]: createdAt };
    }

    try {
        const { count, rows } = await User.findAndCountAll({
            where,
            order: [
                ['createdAt', 'DESC']
            ],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });
        res.json({ code: 0, message: "获取成功", data: { total: count, list: rows, page, pageSize } });


    } catch (error) {
        console.error('查询用户失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}


//注册
exports.Register = async (req, res) => {
    // console.log(req.body);

    const { name, password, avatar, describe, name_display, isSystem, role } = req.body;
    const errmsg = validationResult(req);
    if (!errmsg.isEmpty()) {
        //有校验错误的话
        return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    }


    if (req.user?.role && req.user?.role !== 'super_admin') {
        if (isSystem || role === 'super_admin') {
            //不允许非超级管理员 添加超级管理员
            return res.json({ code: -1, message: '权限不足，不允许添加系统级账号！' });
        }
    }


    try {
        const user = await User.findOne({ where: { name } });
        if (user) {
            return res.json({ code: -1, message: '用户已经存在！' });
        }

        // 使用 bcrypt 对密码进行加盐哈希（强度 10 轮），存储到数据库的是哈希值而非明文
        const hash_psw = await bcrypt.hash(password, 10);
        await User.create({ name, password: hash_psw, avatar, describe, name_display, isSystem, role });

        // console.log(NEWuser.toJSON());

        //生成token
        // const token = jwt.sign(
        //     { id: NEWuser.id, name: NEWuser.name, role: NEWuser.role },
        //     jwtInfo.secret,
        //     { expiresIn: jwtInfo.expiresIn }
        // )
        //header(jwtInfo.tokenName, 'Bearer ' + token)
        res.json({ code: 0, message: '注册成功' });
    } catch (error) {
        console.error('注册失败:', error.message);
        res.status(500).json({ code: -1, message: "注册失败:" + error.message });
    }

}

//登录
exports.Login = async (req, res) => {
    // console.log(req.body);

    const { name, password } = req.body;
    const errmsg = validationResult(req);
    if (!errmsg.isEmpty()) {
        //有校验错误的话
        return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    }

    try {
        const user = await User.findOne({ where: { name } });
        if (!user) {
            return res.json({ code: -1, message: '用户不存在！' });
        }
        //验证密码
        const isTrue = await bcrypt.compare(password, user.password);

        if (!isTrue) {
            return res.json({ code: -1, message: '密码错误！' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            jwtInfo.secret,
            { expiresIn: user.role === 'temp_admin' ? jwtInfo.Temp_expiresIn : jwtInfo.expiresIn }
        )
        // console.log("user.toJSON():", user.toJSON())

        const { password: _p, ...data } = user.toJSON();

        res.header(jwtInfo.tokenName, 'Bearer ' + token).json({ code: 0, message: '登录成功！', data })


    } catch (error) {
        console.error('登录失败:', error.message);
        res.status(500).json({ code: -1, message: "登录失败:" + error.message });
    }
}


//更新用户信息
exports.updateUser = async (req, res) => {
    const { name, password, id, avatar, describe, name_display, isSystem = false, role } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    const errmsg = validationResult(req);
    if (!errmsg.isEmpty()) {
        //有校验错误的话
        return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    }
    try {
        const instance = await User.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '用户不存在' });
        }
        if (instance.isSystem === true || instance.isSystem === false) {
            if (req.user?.role && req.user?.role !== 'super_admin') {
                return res.json({ code: -1, message: '权限不足，不允许更改！' });
            }
            if (instance.name === 'admin' && !avatar) {
                return res.json({ code: -1, message: '初始用户，不允许更改！' });
            }
        }
        if (req.user?.role && req.user?.role !== 'super_admin' && instance.role === 'super_admin') {
            return res.json({ code: -1, message: '权限不足，以下犯上，不允许更改！' });
        }

        if (instance.isSystem && instance.name.includes('CloseAccount') && req.user?.role !== 'super_admin') {
            return res.json({ code: -1, message: '该账号已注销，操作失败！' });
        }

        const _body = { name, avatar, describe, name_display, isSystem };
        if (password !== undefined) {
            const hash_psw = await bcrypt.hash(password, 10);
            _body['password'] = hash_psw;
        }
        if (role !== undefined) {
            _body['role'] = role;
        }

        Object.assign(instance, _body);

        await instance.save();
        const { password: _p, ...data } = instance.toJSON();

        res.json({ code: 0, message: "更新成功", data });


    } catch (error) {
        console.error('更新用户失败:', error.message);
        res.status(500).json({ code: -1, message: '更新失败: ' + error.message });
    }


}

exports.destroyUser = async (req, res) => {
    const { id } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    try {
        const instance = await User.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '用户不存在' });
        }
        if (instance.isSystem || instance.role === 'super_admin') {
            if (req.user?.role !== 'super_admin') {
                return res.json({ code: -1, message: '权限不足，不允许删除！' });
            }
        }
        if (instance.isSystem && instance.name.includes('CloseAccount')) {
            return res.json({ code: -1, message: '该账号已注销，操作失败！' });
        }


        //先找到文章列表
        const { rows: ArticleLists, count } = await Article.findAndCountAll({ where: { userId: instance.id } });
        const { rows: CommentsLists, count: CommentsCount } = await Comments.findAndCountAll({ where: { uId: instance.id } });

        const clearUser = await User.findOne({ where: { isSystem: true, name: 'CloseAccount' } });
        if (count > 0) {
            if (clearUser) {
                // 写法 1：去掉花括号，隐式返回
                await Promise.all(ArticleLists.map(list => { list.userId = clearUser.id; return list.save() }));
            } else {
                return res.json({ code: -1, message: '系统[注销账户：“name:CloseAccount”]账号未配置，无法注销' });
            }
        }
        // return res.json({ code: -1, message: '测试测试 停止', CommentsLists });
        if (CommentsCount > 0) {
            if (clearUser) {
                // 写法 1：去掉花括号，隐式返回
                await Promise.all(CommentsLists.map(list => { list.uId = clearUser.id; return list.save() }));
            } else {
                return res.json({ code: -1, message: '系统[注销账户：“name:CloseAccount”]账号未配置，无法注销' });
            }
        }


        if (instance.avatar?.includes(bucketName)) {
            const objectName = instance.avatar.split(`/${bucketName}/`)[1];
            await minioClient.removeObject(bucketName, objectName);
        }


        const targetId = String(instance.id);
        const tusRows = await TouristsUser.findAll({
            where: { focus: { [Op.like]: `%${targetId}%` } }  // 粗筛，like 只是超集，安全
        });
        const asyncList = [];
        tusRows.forEach(f => {
            const list = f.focus.split(',').map(s => s.trim()).filter(s => s && s !== targetId);
            const next = list.join(',');
            if (next !== f.focus) {
                f.focus = next;
                asyncList.push(f.save());
            }
        });
        asyncList.length && await Promise.all(asyncList);


        await instance.destroy();
        res.json({ code: 0, message: "删除成功" });

    } catch (error) {
        console.error('删除用户失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}



//获取验证码
exports.captcha = (req, res) => {
    //svgCaptcha
    const crypto = require('crypto');
    const captcha = svgCaptcha.create({
        size: 4,          // 验证码长度
        noise: 2,         // 干扰线数量
        color: true,      // 启用彩色字符
        background: '#fafafa', // 设置背景色
        width: 100,       // 宽度（像素）
        height: 33        // 高度（像素）
    });
    global.captchaStore = global.captchaStore || {};
    // 清理过期的验证码
    cleanupExpiredCaptcha();
    const captchaId = crypto.randomUUID();

    // console.log(captcha); // 输出验证码文本，用于后续校验
    // console.log(captcha.data); // 输出 SVG 代码，直接发送给前端
    if (captcha.data) {
        global.captchaStore[captchaId] = {
            code: captcha.text,
            expires: Date.now() + 2 * 60 * 1000  // 2分钟过期
        }

        res.json({ code: 0, data: { svg: captcha.data, captchaId } })
    } else {
        res.json({ code: -1, message: '获取失败' })
    }

}
//校验
exports.verifyCode = (req, res) => {
    //svgCaptcha
    const { code, captchaId } = req.body;
    if (code == undefined || captchaId == undefined) {
        return res.json({ code: -1, message: '参数缺失' });
    }
    // if (process.env.NODE_ENV === 'production') {
    //     console.log('生产环境');
    // } else {
    //     //跳过验证
    //     console.log('开发环境');
    //     if (global.captchaStore?.[captchaId]) {
    //         delete global.captchaStore[captchaId]
    //     }

    //     return res.json({ code: 0, message: '开发环境跳过验证码！！！' });
    // }

    const captchaStore = global.captchaStore?.[captchaId];
    if (!captchaStore) {
        return res.json({ code: -1, message: '验证码不存在' });
    }
    if (Date.now() > captchaStore.expires) {
        delete global.captchaStore[captchaId]
        return res.json({ code: -1, message: '验证码过期' });
    }

    if (captchaStore.code.toLocaleLowerCase() === code.toLocaleLowerCase()) {
        delete global.captchaStore[captchaId]
        return res.json({ code: 0, message: '验证成功' });
    }

    return res.json({ code: -1, message: '验证码错误' });


}

// 在添加新验证码之前，先清理过期的
function cleanupExpiredCaptcha() {
    const now = Date.now();
    for (const key in global.captchaStore) {
        if (global.captchaStore[key].expires < now) {
            delete global.captchaStore[key];
        }
    }
}
