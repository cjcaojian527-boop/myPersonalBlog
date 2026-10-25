const Types = require('../models/ArticleType');
const { Op, Sequelize } = require('sequelize');
const Article = require('../models/ArticleList');


//获取分类列表
exports.getList = async (req, res) => {
    const { query } = req;
    // console.log(query);

    try {
        const types = await Types.findAll({ attributes: ['typeId', 'typeName'] });
        // console.log(types.map(type => type.toJSON()));
        res.status(200).json({ code: 0, message: "获取成功", data: types.map(type => type.toJSON()) });

    } catch (error) {
        console.error('获取失败:', error.message);
        res.status(500).json({ code: -1, message: "获取失败:" + error.message });
    }
}

//高级查询分类
exports.queryTypes = async (req, res) => {
    // console.log(req.body);
    const { formData: { typeName, id, typeId, createdAt }, page = 1, pageSize = 10 } = req.body;

    // 构建查询条件
    const where = {};
    if (typeName) {
        where.typeName = { [Op.like]: `%${typeName}%` };
    }
    if (id) {
        where.id = { [Op.eq]: id };
    }
    if (typeId) {
        where.typeId = { [Op.eq]: typeId };
    }

    if (createdAt && Array.isArray(createdAt) && createdAt.length == 2) {
        where.createdAt = { [Op.between]: createdAt };
    }
    const include = [
        {
            model: Article,
            attributes: ['id', 'title'],  // 只返回文章 id 和 title
            required: false,
        }
    ];

    try {
        const { count, rows } = await Types.findAndCountAll({
            where,
            order: [
                ['createdAt', 'DESC']
            ],
            include,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            distinct: true,
        });
        res.json({ code: 0, message: "获取成功", data: { total: count, list: rows, page, pageSize } });


    } catch (error) {
        console.error('查询文章类型失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}


//添加分类
exports.addType = async (req, res) => {

    try {
        console.log(req.body);
        const { typeName } = req.body;
        if (typeName === undefined || typeName.trim() === '') {
            return res.json({ code: -1, message: "分类名称不能为空" });
        }

        const old = await Types.findOne({ where: { typeName } });
        if (old) {
            return res.json({ code: -1, message: `分类：[${typeName}]已经存在！` });
        }

        const obj = (await Types.create({ typeName })).toJSON();

        res.json({ code: 0, message: "分类新增成功", data: { typeName: obj.typeName, typeId: obj.typeId } });


    } catch (error) {
        console.error('新增失败:', error.message);
        res.status(500).json({ code: -1, message: "新增失败:" + error.message });
    }

}

//更新分类
exports.updateType = async (req, res) => {

    try {
        console.log(req.body);
        const { typeName, typeId } = req.body;
        if (typeName === undefined || typeName.trim() === '') {
            return res.json({ code: -1, message: "分类名称不能为空" });
        }
        if (typeId === undefined || typeId.trim() === '') {
            return res.json({ code: -1, message: "分类ID不能为空" });
        }

        const oldType = await Types.findOne({ where: { typeId } });
        if (!oldType) {
            return res.json({ code: -1, message: `分类：[${typeName}]不存在！` });
        }
        if (oldType.typeName === typeName) {
            return res.json({ code: -1, message: `分类名重复无需修改` });
        }
        oldType.typeName = typeName;
        await oldType.save();
        res.json({ code: 0, message: "分类名修改成功", data: { typeName } });


    } catch (error) {
        console.error('修改失败:', error.message);
        res.status(500).json({ code: -1, message: "修改失败:" + error.message });
    }

}

//删除分类
exports.destroyType = async (req, res) => {

    try {
        console.log(req.body);
        const { typeId } = req.body;

        if (typeId === undefined || typeId.trim() === '') {
            return res.json({ code: -1, message: "分类ID不能为空" });
        }

        const oldType = await Types.findOne({ where: { typeId } });
        if (!oldType) {
            return res.json({ code: -1, message: `分类不存在！` });
        }


        const count = await Article.count({ where: { articleType: typeId } });
        if (count > 0) {
            return res.json({ code: -1, message: `删除失败！该分类已经被文章引用。` });
        }


        await oldType.destroy();
        res.json({ code: 0, message: "分类删除成功" });


    } catch (error) {
        console.error('删除失败:', error.message);
        res.status(500).json({ code: -1, message: "删除失败:" + error.message });
    }

}