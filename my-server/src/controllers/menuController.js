const { Op, Sequelize } = require('sequelize');
const { TempRoute } = require('../config');
const Menu = require('../models/Menu');


//获取菜单
exports.getMenus = async (req, res) => {
    try {
        const menus = await Menu.findAll();
        let isTemp;
        // console.log("req.user:", req.user)
        if (!req.user?.id) {
            return res.json({ code: 0, message: "获取成功", data: menus.map(m => m.toJSON()).filter(f => !f.absolutePath?.startsWith('/admin') && f.absolutePath !== '#') });
        }
        if (req.user?.role && !['super_admin', 'admin'].includes(req.user.role)) {
            //后台管理系统情况时：如果不是管理员或者超级管理员的话
            isTemp = true;
        }
        if (isTemp && menus.length) {
            return res.json({ code: 0, message: "获取成功", data: menus.map(m => m.toJSON()).filter(f => !TempRoute.includes(f.componentPath)) });
        }
        res.json({ code: 0, message: "获取成功", data: menus });
    } catch (error) {
        console.error('查询菜单失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}

//高级查询菜单
exports.queryMenus = async (req, res) => {
    console.log(req.body);
    const { formData: { label, icon, path, absolutePath, componentPath, display, createdAt, id, pid }, page = 1, pageSize = 10 } = req.body;

    // 构建查询条件
    const where = {};
    if (label) {
        where.label = { [Op.like]: `%${label}%` };
    }
    if (icon) {
        where.icon = { [Op.eq]: icon };
    }
    if (id !== undefined) {
        where.pid = { [Op.eq]: id };
    }
    if (pid !== undefined) {
        where.pid = { [Op.eq]: pid };
    }
    if (display) {
        where.display = { [Op.eq]: display };
    }
    if (path) {
        where.path = { [Op.like]: `%${path}%` };
    }
    if (absolutePath) {
        where.absolutePath = { [Op.like]: `%${absolutePath}%` };
    }
    if (componentPath) {
        where.componentPath = { [Op.like]: `%${componentPath}%` };
    }
    if (createdAt && Array.isArray(createdAt) && createdAt.length == 2) {
        where.createdAt = { [Op.between]: createdAt };
    }

    try {
        const { count, rows } = await Menu.findAndCountAll({
            where,
            order: [
                ['createdAt', 'DESC']
            ],
            limit: pageSize,
            offset: (page - 1) * pageSize
        });
        res.json({ code: 0, message: "获取成功", data: { total: count, list: rows, page, pageSize } });


    } catch (error) {
        console.error('查询菜单失败:', error.message);
        res.status(500).json({ code: -1, message: '查询失败: ' + error.message });
    }

}


//添加菜单
exports.addMenu = async (req, res) => {
    const { label, path, componentPath, level } = req.body;
    if (label == undefined) {
        return res.json({ code: -1, message: 'label缺失参数' });
    }
    try {
        if (level !== undefined && level == 3) {
            return res.json({ code: -1, message: '该父菜单没有子菜单' });
        }

        const instance = await Menu.findOne({ where: { label } });
        if (instance) {
            return res.json({ code: -1, message: '菜单名已经存在' });
        }

        const menus = await Menu.create(req.body);
        res.json({ code: 0, message: "添加成功", data: menus.toJSON() });

    } catch (error) {
        console.error('添加菜单失败:', error.message);
        res.status(500).json({ code: -1, message: '添加失败: ' + error.message });
    }
}

exports.updateMenu = async (req, res) => {
    const { id } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    try {

        const instance = await Menu.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '菜单不存在' });
        }
        const params = {};

        for (let key in req.body) {
            if (req.body[key] !== undefined && key in instance) {
                params[key] = req.body[key];
            }
        }
        Object.assign(instance, params);
        await instance.save();
        res.json({ code: 0, message: "更新成功", data: params });

    } catch (error) {
        console.error('更新菜单失败:', error.message);
        res.status(500).json({ code: -1, message: '更新失败: ' + error.message });
    }
}

exports.destroyMeun = async (req, res) => {
    const { id } = req.body;
    if (id == undefined) {
        return res.json({ code: -1, message: '缺失参数' });
    }
    try {

        const instance = await Menu.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '菜单不存在' });
        }

        await instance.destroy();
        res.json({ code: 0, message: "删除成功" });

    } catch (error) {
        console.error('删除菜单失败:', error.message);
        res.status(500).json({ code: -1, message: '删除失败: ' + error.message });
    }
}