const Comments = require('../models/Comment');
const { DB } = require('../config/database');
const { Op } = require("sequelize");
const Searcher = require('ip2region-ts');
const searcher = Searcher.newWithFileOnly(Searcher.defaultDbFile);

const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
const Article = require('../models/ArticleList');
const Tourists = require('../models/touristsUser');
const User = require('../models/User');
const path = require('path');


const filterMap = {

    CommentStatus: (value, where) => {
        where["CommentStatus"] = { [Op.eq]: value };
    },
    context: (value, where) => {
        where["context"] = { [Op.like]: `%${value}%` };
    },

    ClientIp: (value, where) => {
        where["ClientIp"] = { [Op.eq]: value };
    },
    Commentobject: (value, where) => {
        where["Commentobject"] = { [Op.eq]: value };
    },

    articleId: (value, where) => {
        where["articleId"] = { [Op.eq]: value };
    },
    tId: (value, where) => {
        where["tId"] = { [Op.eq]: value };
    },
    uId: (value, where) => {
        where["uId"] = { [Op.eq]: value };
    },
    name: (value, where, include) => {
        include[0].required = true;
        include[0].where = { userId: { [Op.eq]: +value } };
    }
}



exports.getComment = async (req, res) => {

    const { body } = req;

    const pageNum = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(Math.max(1, Number(body.pageSize) || 10), 100);
    const { page: _1, pageSize: _2, formData: queryData } = body;
    const where = {};
    const include = [
        {
            model: Article,
            attributes: ['id', 'title'],   // 只要文章 id 和标题，干净利落
            required: false,                // LEFT JOIN，没对应文章的评论也返回
        },
        {
            model: Tourists,
            //  attributes: [],   // 只要文章 id 和标题，干净利落
            required: false,                // LEFT JOIN，没对应文章的评论也返回
        },
        {
            model: User,
            attributes: [
                'id',
                'name',
                'isSystem',
                [DB.col('name_display'), 'nickName'],  // 起别名
                'avatar',
            ],
            required: false,
        }
    ];

    const obj = {
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
        order: [
            ['createdAt', 'DESC'],
        ]
    }

    // console.log(queryData)
    if (Object.keys(queryData).length) {
        for (let key in queryData) {
            if (filterMap[key] !== undefined) {
                filterMap[key](queryData[key], where, include);
            }
        }
    }
    // console.log(where)

    try {
        const { rows, count } = await Comments.findAndCountAll({ ...obj, where, include });
        // 返回给前端
        res.json({
            code: 0,
            data: {
                list: rows,           // 当前页数据（数组）
                total: count,         // 总记录数（数字）
                pageNum: pageNum,
                pageSize: pageSize
            },
            message: "查询获取成功"
        });

    } catch (error) {
        console.error('查询评论失败:', JSON.stringify(error.errors || error.message || error));
        res.status(500).json({ code: -1, message: '查询评论失败: ' + JSON.stringify(error.errors || error.message || error) });
    }

}

exports.addComment = async (req, res) => {
    let { body } = req;
    if (body.articleId == undefined) {
        return res.json({ code: -1, message: "缺失参数" });
    }
    //body.ClientIp 
    let ip = req.ip.replace(/^::ffff:/, '');  // 去掉 IPv4 映射前缀
    if (ip === '::1') ip = '127.0.0.1';       // 本机调试时的回环地址
    try {

        const article = await Article.findByPk(body.articleId);
        if (!article) {
            return res.json({ code: -1, message: "文章不存在" });
        }
        if (req.user?.role === 'temp_admin' && article.userId !== req.user?.id) {
            return res.json({ code: -1, message: "权限不足，添加评论失败！" });
        }

        //对回复人进行判断 已经注销 注销了不允许回复
        if (body.Commentobject !== undefined) {
            const comment1 = await Comments.findByPk(body.Commentobject);
            if (!comment1) {
                return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
            }

            if (comment1.tId) {
                const tUser = await Tourists.findByPk(comment1.tId);
                if (!tUser) {
                    return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
                }
                if (tUser.isSystem && tUser.email == 'CloseAccount@163.com') {
                    return res.json({ code: -1, message: "游客已注销，操作失败！" });
                }

            } else if (comment1.uId) {
                const _User = await User.findByPk(comment1.uId);
                if (!_User) {
                    return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
                }
                if (_User.isSystem && _User.name == 'CloseAccount') {
                    return res.json({ code: -1, message: "用户已注销，操作失败！" });
                }
            } else {
                return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
            }
        }

        if (body.tId !== undefined && body.isPass == undefined) {
            const instance = await Tourists.findByPk(body.tId);
            if (instance && instance.isBanned) {
                return res.json({ code: -1, message: "您已被禁言，请稍后再试！" });
            }
        }
        if (!body.isPass) {
            body.CommentStatus = "pending";
        } else {
            delete body.isPass;
        }




        //翻译成属地
        //trust proxy 千万别漏：如果部署时走了 nginx，记得在主文件里加 app.set('trust proxy', true)，
        // 否则 req.ip 拿到的是 nginx 的 IP
        // 解析 ip2region 返回值：'国家|区域|省份|城市|运营商'
        // 缺失字段是字符串 '0'，不能用 truthy 判断（"0" 也是真值）
        const parseRegion = (region = '') => {
            const [country, area, province, city, isp] = region.split('|');
            if (province == '0') {
                return country;
            }
            return province;
        };

        let clientIp = '未知';
        try {
            const { region } = (await searcher.search(ip)) || {};
            console.log('评论获取ip信息--', region);
            clientIp = parseRegion(region);
        } catch (err) {
            // 属地解析失败不影响评论创建
            console.warn('IP 属地解析失败:', ip, err.message);
        }
        body.ClientIp = clientIp;

        const obj = await Comments.create(body);
        return res.json({ code: 0, message: "评论添加成功", data: obj.toJSON() });

    } catch (error) {
        console.error('添加评论失败:', JSON.stringify(error.errors || error.message || error));
        res.status(500).json({ code: -1, message: '添加评论失败: ' + JSON.stringify(error.errors || error.message || error) });
    }
}





exports.updateComment = async (req, res) => {
    const { id, ...params } = req.body;
    if (id === undefined) {
        return res.json({ code: -1, message: "缺失参数id" });
    }

    try {
        const isntance = await Comments.findByPk(id);
        if (!isntance) {
            return res.json({ code: -1, message: "评论不存在" });
        }

        if (req.user?.role === 'temp_admin' && isntance.uId !== req.user?.id) {
            return res.json({ code: -1, message: "权限不足，修改评论失败！" });
        }

        if (isntance.tId) {
            const tUser = await Tourists.findByPk(isntance.tId);
            if (!tUser) {
                return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
            }
            if (tUser.isSystem && tUser.email == 'CloseAccount@163.com') {
                return res.json({ code: -1, message: "游客已注销，操作失败！" });
            }

        } else if (isntance.uId) {
            const _User = await User.findByPk(isntance.uId);
            if (!_User) {
                return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
            }
            if (_User.isSystem && _User.name == 'CloseAccount') {
                return res.json({ code: -1, message: "用户已注销，操作失败！" });
            }
        } else {
            return res.json({ code: -1, message: "回复目标未找到，回复失败！" });
        }

        Object.assign(isntance, params);
        await isntance.save();

        return res.json({ code: 0, message: "修改成功", data: isntance.toJSON() });

    } catch (error) {
        console.error('修改文章失败:', error.message);
        res.status(500).json({ code: -1, message: '修改失败: ' + error.message });
    }
}
const editLikeStrings = (commentLikeStrings) => {

    if (commentLikeStrings == undefined) return [];
    // console.log("commentLikeStrings:", commentLikeStrings);
    if (Object.prototype.toString.call(commentLikeStrings) === '[object Array]') {
        return commentLikeStrings.filter(f => f !== '' && f.trim().length > 0);
    }
    const list = commentLikeStrings.split(',').filter(f => f !== '' && f.trim().length > 0);
    return list;
}


exports.destroyComment = async (req, res) => {
    let { id, tId, articleId } = req.query;
    if (id === undefined) {
        return res.json({ code: -1, message: "缺失参数id" });
    }
    const _uuid = tId + '_' + articleId + '_' + id;

    try {
        const isntance = await Comments.findByPk(id);
        if (!isntance) {
            return res.json({ code: -1, message: "评论不存在" });
        }

        if (req.user?.role === 'temp_admin' && isntance.uId !== req.user?.id) {
            return res.json({ code: -1, message: "权限不足，删除评论失败！" });
        }


        const tourist1 = await Tourists.findByPk(tId);
        if (tourist1) {

            const isHeartFilled = editLikeStrings(tourist1.commentLikeStrings).includes(_uuid);
            // console.log("tourist1.commentLikeStrings:",tourist1.commentLikeStrings,isHeartFilled,_uuid);
            // console.log(editLikeStrings(tourist1.commentLikeStrings))
            if (isHeartFilled) {
                //包含的话
                tourist1.commentLikeStrings = editLikeStrings(tourist1.commentLikeStrings).filter(f => f !== _uuid).join(',');
                await tourist1.save();
            }
        }


        await isntance.destroy();
        return res.json({ code: 0, message: "删除成功" });
    } catch (error) {
        console.error('删除评论失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}