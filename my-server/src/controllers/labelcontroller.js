const Labels = require('../models/labels');
const Article = require('../models/ArticleList');
const { Op } = require('sequelize');



const filterMap = {
    labelName: (value, where, include) => {
        where['labelName'] = { [Op.like]: `%${value}%` };
    },
    labelId: (value, where, include) => {
        where['labelId'] = value;
    },
    articleId: (value, where, include) => {
        include[0].required = true;
        include[0].where = { id: { [Op.in]: value } };
    },
    createdAt: (value, where) => {
        where['createdAt'] = { [Op.between]: value }
    }
}


const getQuery = (params = {}) => {

    const where = {};
    const include = [
        {
            model: Article,
            through: { attributes: [] },  // 不返回中间表字段
            // attributes: ['id', 'title'],  // 只返回文章 id 和 title
            required: false,              // LEFT JOIN，没文章的标签也返回
        }
    ];
    const keys = Object.keys(params);
    if (!keys.length) return { include };
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (params[key] === undefined || params[key] === "" || params[key] === null) {
            continue;
        }
        if (filterMap[key] !== undefined) {
            filterMap[key](params[key], where, include)
        }
    }

    const Q = { where };
    if (include.length) Q.include = include;

    return Q;
}

//获取标签集
exports.getLabels = async (req, res) => {

    const { body } = req;
    // console.log(body);
    const pageNum = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(Math.max(1, Number(body.pageSize) || 10), 100);

    try {
        const { pageNum: _1, pageSize: _2, formData: queryParams = {} } = body;
        const sqlObj = {
            offset: (pageNum - 1) * pageSize,
            limit: pageSize,
            distinct: true,  // 多对多关联时必须加
            ...getQuery(queryParams)
        };

        const { count, rows } = await Labels.findAndCountAll(sqlObj);

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
        console.error('查询标签失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}

exports.addLabels = async (req, res) => {

    const { labelName } = req.body;
    // console.log("labelName:", labelName);

    if (labelName === undefined || labelName.trim().length === 0) {
        return res.json({ code: -1, message: "缺失标签名" });
    }

    try {
        const list = await Labels.findAll({ where: { labelName } });
        if (list.length) {
            return res.json({ code: -1, message: "标签已存在" });
        }

        const instance = await Labels.create({ labelName });
        return res.json({ code: 0, message: '添加成功', data: instance.toJSON() })

    } catch (error) {
        console.error('添加标签失败:', error.message);
        res.status(500).json({ code: -1, message: '添加失败: ' + error.message });
    }

};
//修改
exports.updateLabels = async (req, res) => {

    const { labelName: newName, labelId } = req.body;

    if (newName === undefined || newName.trim().length === 0) {
        return res.json({ code: -1, message: "缺失标签名" });
    }
    if (labelId === undefined || labelId.trim().length === 0) {
        return res.json({ code: -1, message: "缺失标签ID参数" });
    }


    try {
        const instance = await Labels.findOne({ where: { labelId } });

        if (!instance) {
            return res.json({ code: -1, message: "标签不存在" });
        }
        if (instance.labelName === newName) {
            return res.json({ code: -1, message: "标签名一致，无需修改" });
        }
        instance.labelName = newName;
        await instance.save();

        return res.json({ code: 0, message: '修改成功', data: instance.toJSON() });

    } catch (error) {
        console.error('修改标签失败:', error.message);
        res.status(500).json({ code: -1, message: '修改失败: ' + error.message });
    }

};
//删除
exports.destroyLabels = async (req, res) => {

    const { labelId } = req.body;

    if (labelId === undefined || labelId.trim().length === 0) {
        return res.json({ code: -1, message: "缺失标签ID参数" });
    }


    try {
        const instance = await Labels.findOne({ where: { labelId } });

        if (!instance) {
            return res.json({ code: -1, message: "标签不存在" });
        }

        await instance.destroy();

        return res.json({ code: 0, message: '删除成功' });

    } catch (error) {
        console.error('删除标签失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }

};