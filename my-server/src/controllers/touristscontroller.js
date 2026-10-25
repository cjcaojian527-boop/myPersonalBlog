const { Op, Sequelize } = require('sequelize');
const TouristsUser = require('../models/touristsUser');
const Comments = require('../models/Comment');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
const { minioClient } = require('../services/minio');
const { jwtInfo } = require('../config');
const { generateRandomAvatar } = require('../utils');
// const svgCaptcha = require('svg-captcha');
const Searcher = require('ip2region-ts');
const searcher = Searcher.newWithFileOnly(Searcher.defaultDbFile);
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // bcryptjs：用于密码加盐哈希，保护用户密码安全



//高级查询用户
exports.queryUsers = async (req, res) => {

    const { formData: { createdAt, nickName, email, id, isSystem, clientIp }, page = 1, pageSize = 10 } = req.body;

    // 构建查询条件
    const where = {};
    if (nickName !== undefined) {
        where.nickName = { [Op.like]: `%${nickName}%` };
    }
    if (email !== undefined) {
        where.email = { [Op.like]: `%${email}%` };
    }
    if (id !== undefined) {
        where.id = { [Op.eq]: id };
    }
    if (isSystem !== undefined) {
        where.isSystem = { [Op.eq]: isSystem };
    }
    if (clientIp !== undefined) {
        where.clientIp = { [Op.eq]: clientIp };
    }


    if (createdAt && Array.isArray(createdAt) && createdAt.length == 2) {
        where.createdAt = { [Op.between]: createdAt };
    }

    try {
        const { count, rows } = await TouristsUser.findAndCountAll({
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

    let { nickName, email, avatar, likeStrings, viewStrings, isBanned, isSystem, collects, focus, commentLikeStrings } = req.body;
    // const errmsg = validationResult(req);
    // if (!errmsg.isEmpty()) {
    //     //有校验错误的话
    //     return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    // }
    let ip = req.ip.replace(/^::ffff:/, '');  // 去掉 IPv4 映射前缀
    if (ip === '::1') ip = '127.0.0.1';       // 本机调试时的回环地址

    if (req.user?.role && req.user?.role !== 'super_admin') {
        if (isSystem) {
            //不允许非超级管理员 添加超级管理员
            return res.json({ code: -1, message: '权限不足，不允许添加系统级账号！' });
        }
    }


    try {
        const byName = await TouristsUser.findOne({ where: { nickName } });
        if (byName) {
            return res.json({ code: -1, message: '该昵称已被使用' });
        }

        const byEmail = await TouristsUser.findOne({ where: { email } });
        if (byEmail) {
            return res.json({ code: -1, message: '该邮箱已被注册' });
        }
        if (!req.user && !avatar) {
            //自定义头像
            let file = await generateRandomAvatar();
            if (file) {
                // 生成唯一文件名
                const ext = path.extname(file.originalname);
                const objectName = `images/${file.fieldname}/${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;

                // 从 Buffer 上传
                await minioClient.putObject(
                    bucketName,                    // 存储桶
                    objectName,                // 对象名
                    file.buffer,               // Buffer 数据
                    file.buffer.length,
                    {
                        'Content-Type': file.mimetype,
                        'Content-Disposition': 'inline',
                    }
                );
                file = null;
                //http://${MINIO_OBJ.endPoint}:${MINIO_OBJ.port}
                const fileUrl = `/${bucketName}/${objectName}`;
                avatar = fileUrl;
                // return res.json({ code: 0, message: "文件上传成功！", data: fileUrl });

            } else {
                return res.json({ code: -1, message: "文件上传失败~" });
            }
        }
        let clientIp = '未知';
        try {
            const { region } = (await searcher.search(ip)) || {};
            console.log('文章获取ip信息：', region);
            clientIp = parseRegion(region);
        } catch (err) {
            // 属地解析失败不影响评论创建
            console.warn('IP 属地解析失败:', ip, err.message);
        }



        await TouristsUser.create({ nickName, email, clientIp, avatar, likeStrings, viewStrings, isBanned, isSystem, collects, focus, commentLikeStrings, navigator: req.headers['user-agent'] });

        //生成token
        // const token = jwt.sign(
        //     { id: NEWuser.id, nickName, email },
        //     jwtInfo.secret,
        //     { expiresIn: jwtInfo.expiresIn }
        // )

        res.json({ code: 0, message: '注册成功' });
    } catch (error) {
        console.error('注册失败:', error.message);
        res.status(500).json({ code: -1, message: "注册失败:" + error.message });
    }

}
//更新用户信息
exports.updateUser = async (req, res) => {
    const { nickName, email, id, avatar, likeStrings, viewStrings, navigator, isBanned, isSystem, collects, focus, commentLikeStrings } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    const errmsg = validationResult(req);
    if (!errmsg.isEmpty()) {
        //有校验错误的话
        return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    }

    if (req.user?.role && req.user?.role !== 'super_admin') {
        if (isSystem !== undefined) {
            //不允许非超级管理员 添加超级管理员
            return res.json({ code: -1, message: '权限不足，操作失败！' });
        }
    }
    try {
        const instance = await TouristsUser.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '用户不存在' });
        }
        if (instance.isSystem && instance.email.includes('CloseAccount') && req.user?.role !== 'super_admin') {
            return res.json({ code: -1, message: '该账号已注销，操作失败！' });
        }
        if (req.Tourists_user) {
            if (req.Tourists_user.id !== id || req.Tourists_user.nickName !== nickName || req.Tourists_user.email !== email) {
                return res.json({ code: -1, message: '权限不足，修改失败！' });
            }

        }
        const _body = { nickName, avatar, email, likeStrings, viewStrings, navigator, isBanned, isSystem, collects, focus, commentLikeStrings };

        for (let key in _body) {
            if (_body[key] !== undefined) {
                Object.assign(instance, { [key]: _body[key] });
            }
        }


        await instance.save();

        res.json({ code: 0, message: "更新成功", data: instance.toJSON() });


    } catch (error) {
        console.error('更新用户失败:', error.message);
        res.status(500).json({ code: -1, message: '更新失败: ' + error.message });
    }


}

exports.destroyUser = async (req, res) => {
    const { id, nickName, email } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    try {

        const instance = await TouristsUser.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '游客不存在' });
        }
        if (req.user?.role && req.user?.role !== 'super_admin') {
            if (instance.isSystem) {
                //不允许非超级管理员 添加超级管理员
                return res.json({ code: -1, message: '权限不足，不允许删除！' });
            }
        }
        //   { id: user.id, nickName, email },
        //游客自己注销账号的话只能删除自己
        if (req.Tourists_user) {
            if (req.Tourists_user.id !== id || req.Tourists_user.nickName !== nickName || req.Tourists_user.email !== email) {
                return res.json({ code: -1, message: '权限不足，注销失败！' });
            }

        }


        const { rows: CommentsLists, count: CommentsCount } = await Comments.findAndCountAll({ where: { tId: instance.id } });
        const clearUser = await TouristsUser.findOne({ where: { isSystem: true, email: 'CloseAccount@163.com' } });
        if (CommentsCount > 0) {
            if (clearUser) {
                // 写法 1：去掉花括号，隐式返回
                await Promise.all(CommentsLists.map(list => { list.tId = clearUser.id; return list.save() }));
            } else {
                return res.json({ code: -1, message: '系统[注销账户：“email: CloseAccount@163.com”]账号未配置，无法注销' });
            }
        }
        // console.log(instance);
        if (instance.avatar?.includes(bucketName)) {
            const objectName = instance.avatar.split(`/${bucketName}/`)[1];
            await minioClient.removeObject(bucketName, objectName);
        }

        await instance.destroy();
        res.json({ code: 0, message: "删除成功" });

    } catch (error) {
        console.error('删除用户失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}

//登录
exports.Login = async (req, res) => {
    // console.log(req.body);

    const { nickName, email } = req.body;
    const errmsg = validationResult(req);
    if (!errmsg.isEmpty()) {
        //有校验错误的话
        return res.json({ code: -1, errors: errmsg.array(), message: errmsg.array().map(m => m.msg).join() });
    }

    try {
        const user = await TouristsUser.findOne({ where: { nickName } });
        if (!user) {
            return res.json({ code: -1, message: '游客不存在,请先注册账号!' });
        }
        //验证密码
        const isTrue = email === user.email;

        if (!isTrue) {
            return res.json({ code: -1, message: '邮箱重复!' });
        }


        const token = jwt.sign(
            { id: user.id, nickName, email },
            jwtInfo.T_secret,
            { expiresIn: jwtInfo.expiresIn }
        )

        res.header(jwtInfo.TouriststokenName, 'Bearer ' + token).json({ code: 0, message: '登录成功！', data: user.toJSON() })


    } catch (error) {
        console.error('登录失败:', error.message);
        res.status(500).json({ code: -1, message: "登录失败:" + error.message });
    }
}

// //获取验证码
// exports.captcha = (req, res) => {
//     //svgCaptcha
//     const crypto = require('crypto');
//     const captcha = svgCaptcha.create({
//         size: 4,          // 验证码长度
//         noise: 2,         // 干扰线数量
//         color: true,      // 启用彩色字符
//         background: '#fafafa', // 设置背景色
//         width: 100,       // 宽度（像素）
//         height: 33        // 高度（像素）
//     });
//     global.captchaStore = global.captchaStore || {};
//     // 清理过期的验证码
//     cleanupExpiredCaptcha();
//     const captchaId = crypto.randomUUID();

//     // console.log(captcha); // 输出验证码文本，用于后续校验
//     // console.log(captcha.data); // 输出 SVG 代码，直接发送给前端
//     if (captcha.data) {
//         global.captchaStore[captchaId] = {
//             code: captcha.text,
//             expires: Date.now() + 2 * 60 * 1000  // 2分钟过期
//         }

//         res.json({ code: 0, data: { svg: captcha.data, captchaId } })
//     } else {
//         res.json({ code: -1, message: '获取失败' })
//     }

// }
// //校验
// exports.verifyCode = (req, res) => {
//     //svgCaptcha
//     const { code, captchaId } = req.body;
//     if (code == undefined || captchaId == undefined) {
//         return res.json({ code: -1, message: '参数缺失' });
//     }
//     // if (process.env.NODE_ENV === 'production') {
//     //     console.log('生产环境');
//     // } else {
//     //     //跳过验证
//     //     console.log('开发环境');
//     //     delete global.captchaStore[captchaId]
//     //     return res.json({ code: 0, message: '开发环境跳过验证码！！！' });
//     // }

//     const captchaStore = global.captchaStore?.[captchaId];
//     if (!captchaStore) {
//         return res.json({ code: -1, message: '验证码不存在' });
//     }
//     if (Date.now() > captchaStore.expires) {
//         delete global.captchaStore[captchaId]
//         return res.json({ code: -1, message: '验证码过期' });
//     }

//     if (captchaStore.code.toLocaleLowerCase() === code.toLocaleLowerCase()) {
//         delete global.captchaStore[captchaId]
//         return res.json({ code: 0, message: '验证成功' });
//     }

//     return res.json({ code: -1, message: '验证码错误' });


// }

// 在添加新验证码之前，先清理过期的
function cleanupExpiredCaptcha() {
    const now = Date.now();
    for (const key in global.captchaStore) {
        if (global.captchaStore[key].expires < now) {
            delete global.captchaStore[key];
        }
    }
}
