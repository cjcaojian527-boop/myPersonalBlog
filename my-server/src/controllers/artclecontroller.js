const Article = require('../models/ArticleList');
const { Op } = require("sequelize");
const Context = require('../models/context');
const Users = require('../models/User');
const Labels = require('../models/labels');
const Article_Labels = require('../models/article_labels');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
const { minioClient } = require('../services/minio');
const Searcher = require('ip2region-ts');
const searcher = Searcher.newWithFileOnly(Searcher.defaultDbFile);


const filterMap = {

    title: (value, where) => {
        where["title"] = { [Op.like]: `%${value}%` };
    },
    isTop: (value, where) => {
        where["isTop"] = { [Op.eq]: value };
    },

    articleType: (value, where) => {
        where["articleType"] = { [Op.eq]: value };
    },

    userId: (value, where) => {
        where["userId"] = value;
    },
    // 按一组博主 User id 查文章，给「关注」tab 用。
    // 兼容数组和逗号串，顺手把空值 / 非法数字剔掉，避免 Op.in 里混进 NaN
    userIdStrings: (value, where) => {
        const ids = (Array.isArray(value) ? value : String(value).split(','))
            .map(Number)
            .filter(n => Number.isInteger(n) && n > 0);
        where["userId"] = { [Op.in]: ids };
    },
    ContextId: (value, where, include) => {
        include.push({
            model: Context,
            where: { id: value },
            required: true,//内连接
            // attributes: [],//空数组表示不返回 Context 表的任何字段
        })
    },
    labelId: (value, where, include) => {
        // 不改 include 结构，只叠加条件
        include[0].where = { labelId: { [Op.in]: value } };
        include[0].required = true;

        // through 还在，Sequelize 正确识别多对多关联 ✅
    },
    idStrings: (value, where) => {
        where["id"] = { [Op.in]: value.split(',').map(Number) };
    },

}

exports.getList = async (req, res) => {
    const { body } = req;

    const pageNum = Math.max(1, Number(body.pageNum) || 1);
    const pageSize = Math.min(Math.max(1, Number(body.pageSize) || 10), 100);

    const { pageNum: _1, pageSize: _2, formData: queryData = {} } = body;
    const where = {};
    const include = [
        {
            model: Labels,
            through: { attributes: [] },  // 不返回中间表字段
            // attributes: ['id', 'title'],  // 只返回文章 id 和 title
            required: false,              // LEFT JOIN，没文章的标签也返回
        },
        {
            model: Users,
            attributes: [
                'id',
                'name',
                'isSystem',
                'name_display',  // 起别名
                'avatar',
                'role',
            ],
            required: false,
        }
    ];

    const obj = {
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
    }
    if (Object.keys(queryData).length) {
        for (let key in queryData) {
            if (filterMap[key] !== undefined) {
                filterMap[key](queryData[key], where, include);
            }
        }

    }
    if (queryData.createdAt && Array.isArray(queryData.createdAt) && queryData.createdAt.length == 2) {
        where.createdAt = { [Op.between]: queryData.createdAt };
    }

    try {

        const { rows, count } = await Article.findAndCountAll({ ...obj, where, include });

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
        console.error('查询文章失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}

exports.add = async (req, res) => {

    let { title, articleType, userId, labelId: labelIdList, coverImage = '', likes = 0, isTop = false, collects = 0 } = req.body;
    if (title === undefined || articleType === undefined || userId === undefined) {
        return res.json({ code: -1, message: "缺失参数：title | articleType | userId" });
    }
    let ip = req.ip.replace(/^::ffff:/, '');  // 去掉 IPv4 映射前缀
    if (ip === '::1') ip = '127.0.0.1';       // 本机调试时的回环地址


    try {
        const isntance = await Article.findOne({ where: { title } });
        if (isntance) {
            return res.json({ code: -1, message: "文章已存在" });
        }

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
            console.log('文章获取ip信息：', region);
            clientIp = parseRegion(region);
        } catch (err) {
            // 属地解析失败不影响评论创建
            console.warn('IP 属地解析失败:', ip, err.message);
        }


        const obj = await Article.create({ title, articleType, userId, coverImage, likes, isTop, collects, ClientIp });



        //打标签
        if (labelIdList !== undefined) {

            if (Object.prototype.toString.call(labelIdList) === '[object String]') {
                labelIdList = [labelIdList];
            }
            const asyncList = [];

            labelIdList.forEach(id => {
                asyncList.push(Article_Labels.create({ articleId: obj.id, labelId: id }))
            });
            const respList = await Promise.all(asyncList);
            if (respList.length !== asyncList.length) {
                return res.json({ code: -1, message: "文章打标签失败，操作继续，文章添加成功！" });
            }

        }


        return res.json({ code: 0, message: "添加成功", data: obj.toJSON() });


    } catch (error) {
        console.error('添加文章失败:', error.message);
        res.status(500).json({ code: -1, message: '添加失败: ' + error.message });
    }


}



exports.update = async (req, res) => {
    let { title, articleType, userId, id, labelId: labelIdList, coverImage, likes, isTop, collects } = req.body;
    if (id === undefined) {
        return res.json({ code: -1, message: "缺失参数ID" });
    }

    try {
        const isntance = await Article.findByPk(id);
        if (!isntance) {
            return res.json({ code: -1, message: "文章不存在" });
        }
        if (req.user?.role === 'temp_admin') {
            if (req.user?.id !== isntance.userId) {
                //操作的对象不是自己的话
                return res.json({ code: -1, message: '权限不足，操作失败！' });
            }
        }

        if (title !== undefined) {
            isntance.title = title;
        }
        if (articleType !== undefined) {
            isntance.articleType = articleType;
        }
        if (userId !== undefined) {
            isntance.userId = userId;
        }
        if (coverImage !== undefined) {
            isntance.coverImage = coverImage;
        }
        if (collects !== undefined) {
            isntance.collects = collects;
        }
        if (likes !== undefined) {
            isntance.likes = likes;
        }
        if (isTop !== undefined) {
            isntance.isTop = isTop;
        }


        //改标签
        if (labelIdList !== undefined) {

            if (Object.prototype.toString.call(labelIdList) === '[object String]') {
                labelIdList = [labelIdList];
            }
            const asyncList = [];
            const sourceList = await Article_Labels.findAll({ where: { articleId: isntance.id } });

            sourceList.forEach(f => {
                if (!labelIdList.includes(f.labelId)) {
                    asyncList.push(f.destroy())
                }
            });
            const addlist = labelIdList.filter(id => !sourceList.some(s => s.labelId == id));
            if (addlist.length) {
                addlist.forEach(id => {
                    asyncList.push(Article_Labels.create({ articleId: isntance.id, labelId: id }))
                });
            }
            const respList = await Promise.all(asyncList);
            if (respList.length !== asyncList.length) {
                return res.json({ code: -1, message: "文章改标签失败，操作中断！" });
            }

        }
        await isntance.save();


        return res.json({ code: 0, message: "修改成功", data: isntance.toJSON() });


    } catch (error) {
        console.error('修改文章失败:', error.message);
        res.status(500).json({ code: -1, message: '修改失败: ' + error.message });
    }
}

exports.destroy = async (req, res) => {
    const { id } = req.query;
    if (id === undefined) {
        return res.json({ code: -1, message: "缺失参数ID" });
    }
    try {
        const isntance = await Article.findByPk(id);
        if (!isntance) {
            return res.json({ code: -1, message: "文章不存在" });
        }
        if (isntance.userId !== req.user?.id && req.user?.role === 'temp_admin') {
            return res.json({ code: -1, message: "权限不足，删除失败！" });
        }
        if (isntance.coverImage?.includes(bucketName)) {
            const objectName = isntance.coverImage.split(`/${bucketName}/`)[1];
            await minioClient.removeObject(bucketName, objectName);
        }

        await isntance.destroy();
        return res.json({ code: 0, message: "删除成功" });

    } catch (error) {
        console.error('删除文章失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}