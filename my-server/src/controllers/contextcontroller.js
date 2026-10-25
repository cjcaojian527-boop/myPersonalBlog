const Context = require('../models/context');
const { model } = require('../models/context');
const { Op } = require("sequelize");
const { minioClient } = require('../services/minio');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
const Article = require('../models/ArticleList');
const User = require('../models/User');
const path = require('path');


const filterMap = {

    name: (value, where) => {
        where["name"] = { [Op.like]: `%${value}%` };
    },
    label: (value, where) => {
        where["label"] = { [Op.like]: `%${value}%` };
    },

    elementType: (value, where) => {
        where["elementType"] = value;
    },

    articleId: (value, where) => {
        where["articleId"] = { [Op.eq]: value };
    }
}

exports.getList = async (req, res) => {
    const { body } = req;

    const pageNum = Math.max(1, Number(body.pageNum) || 1);
    const pageSize = Math.min(Math.max(1, Number(body.pageSize) || 10), 100);

    const { pageNum: _1, pageSize: _2, ...queryData } = body;
    const where = {};
    const include = [];

    const obj = {
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
        order: [
            ['createdAt', 'DESC'],
        ]
    }
    if (Object.keys(queryData).length) {
        for (let key in queryData) {
            if (filterMap[key] !== undefined) {
                filterMap[key](queryData[key], where, include);
            }
        }
    }

    try {
        const { rows, count } = await Context.findAndCountAll({ ...obj, where, include });
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
        console.error('查询内容失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}

exports.add = async (req, res) => {

    let { body, file } = req;
    if (body.articleId == undefined || body.order == undefined || body.elementType == undefined || body.label == undefined) {
        return res.json({ code: -1, message: "缺失参数" });
    }

    try {
        const article = await Article.findByPk(body.articleId);
        if (!article) {
            return res.json({ code: -1, message: "文章不存在" });
        }
        if (article.userId !== req.user?.id && req.user?.role === 'temp_admin') {
            return res.json({ code: -1, message: "权限不足，添加内容失败！" });
        }

        const isntance = await Context.findOne({ where: { label: body.label } });
        if (isntance) {
            return res.json({ code: -1, message: "内容已存在" });
        }
        // console.log(body);
        if (file) {
            // 生成唯一文件名
            const ext = path.extname(file.originalname);
            const objectName = `images/${file.fieldname}/${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;

            // 从 Buffer 上传
            const etag = await minioClient.putObject(
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
            body.content = fileUrl;

        }
        body.order = Number(body.order);
        body.articleId = Number(body.articleId);


        const obj = await Context.create(body);

        return res.json({ code: 0, message: "添加成功", data: obj.toJSON() });

    } catch (error) {
        console.error('添加内容失败:', error.errors);
        res.status(500).json({ code: -1, message: '添加失败: ' + error.message });
    }
}


function isValidUrl(string) {
    try {
        // 尝试用传入的字符串创建一个新的 URL 对象
        new URL(string);
        // 如果没有抛出错误，说明是有效的 URL
        return true;
    } catch (err) {
        // 如果抛出了错误，说明是无效的 URL
        return false;
    }
}



exports.update = async (req, res) => {
    const { contextId, ...params } = req.body;
    if (contextId === undefined) {
        return res.json({ code: -1, message: "缺失参数contextId" });
    }
    if (params.objectName !== undefined && !isValidUrl(`http://${MINIO_OBJ.endPoint}:${MINIO_OBJ.port}` + params.objectName)) {
        delete params.objectName;
    }

    try {
        // if (params.name !== undefined) {
        //     const user = await User.findOne({ where: { name: params.name } });
        //     if (!user) {
        //         return res.json({ code: -1, message: "用户：" + params.name + " 不存在！" });
        //     }
        // }
        const isntance = await Context.findByPk(contextId);
        if (!isntance) {
            return res.json({ code: -1, message: "内容不存在，改动失败！" });
        }
        const article = await Article.findByPk(isntance.articleId);
        if (!article) {
            return res.json({ code: -1, message: "文章不存在，改动失败！" });
        }
        if (article.userId !== req.user?.id && req.user?.role === 'temp_admin') {
            return res.json({ code: -1, message: "权限不足，改动内容失败！" });
        }
        if (isntance.elementType.includes('/') && !params.elementType.includes('/')) {
            //文件转文本 去掉文件
            if (params.objectName) {
                params.objectName = params.objectName.split(`/${bucketName}/`)[1];

                await minioClient.removeObject(bucketName, params.objectName);
                console.log('文件删除成功：' + params.objectName);
                delete params.objectName;
            }
        }

        if (req.file) {
            if (params.objectName) {
                params.objectName = params.objectName.split(`/${bucketName}/`)[1];

                await minioClient.removeObject(bucketName, params.objectName);
                console.log('文件删除成功：' + params.objectName);
                delete params.objectName;
            }
            // 生成唯一文件名
            const ext = path.extname(req.file.originalname);
            const objectName = `images/${req.file.fieldname}/${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;

            // 从 Buffer 上传
            const etag = await minioClient.putObject(
                bucketName,                    // 存储桶
                objectName,                // 对象名
                req.file.buffer,               // Buffer 数据
                req.file.buffer.length,
                {
                    'Content-Type': req.file.mimetype,
                    'Content-Disposition': 'inline',
                }
            );
            req.file = null;
            //http://${MINIO_OBJ.endPoint}:${MINIO_OBJ.port}
            const fileUrl = `/${bucketName}/${objectName}`;
            params.content = fileUrl;
        }

        Object.assign(isntance, params);
        await isntance.save();

        return res.json({ code: 0, message: "修改成功", data: isntance.toJSON() });

    } catch (error) {
        console.error('修改文章失败:', error.message);
        res.status(500).json({ code: -1, message: '修改失败: ' + error.message });
    }
}

exports.destroy = async (req, res) => {
    let { contextId } = req.query;
    if (contextId === undefined) {
        return res.json({ code: -1, message: "缺失参数contextId" });
    }
    const contextIdList = contextId.split('-');
    if (contextIdList.length == 0) {
        return res.json({ code: -1, message: "删除内容长度为空！" });
    }
    let errorN = 0;

    try {
        for (let i = 0; i < contextIdList.length; i++) {
            let contextId = contextIdList[i];
            const isntance = await Context.findByPk(contextId);
            if (!isntance) {
                return res.json({ code: -1, message: "内容不存在" });
            }
            const article = await Article.findByPk(isntance.articleId);
            if (!article) {
                continue;
            }
            if (article.userId !== req.user?.id && req.user?.role === 'temp_admin') {
                errorN++;
                continue;
                // return res.json({ code: -1, message: "权限不足，改动内容失败！" });
            }

            if (isntance.elementType.includes('/') && isntance.content.includes(bucketName)) {
                const objectName = isntance.content.split(`/${bucketName}/`)[1];
                await minioClient.removeObject(bucketName, objectName);
            }
            await isntance.destroy();
        }
        if (errorN) {
            return res.json({ code: -1, message: `删除成功：${contextIdList.length - errorN} / 删除失败：${errorN} \n 原因：权限不足，请联系管理员！` });
        }

        return res.json({ code: 0, message: "删除成功" });

    } catch (error) {
        console.error('删除内容失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}