const { Sequelize, DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const menusData = require('../seeds/menus');

const Menu = DB.define('Menu', {
    pid: {
        type: DataTypes.INTEGER,
        allowNull: true,// false:不允许null
        //unique: true,     // 唯一约束
        defaultValue: -1,
        comment: '父菜单'
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,//false:不允许null
        unique: true,     // 唯一约束
        comment: '菜单标题'
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true,//false:不允许null
        // unique: true,     // 唯一约束
        defaultValue: '',
        comment: '菜单图标'
    },
    path: {
        type: DataTypes.STRING,
        allowNull: true,//false:不允许null
        // unique: true,     // 唯一约束
        defaultValue: '#',
        comment: '路由地址'
    },
    absolutePath: {
        type: DataTypes.STRING,
        allowNull: true,//false:不允许null
        // unique: true,     // 唯一约束
        defaultValue: '#',
        comment: '路由绝对地址'
    },
    componentPath: {
        type: DataTypes.STRING,
        allowNull: true,//false:不允许null
        // unique: true,     // 唯一约束
        defaultValue: '#',
        comment: '组件地址'
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,//false:不允许null
        // unique: true,     // 唯一约束
        comment: '层级'
    },
    display: {
        type: DataTypes.BOOLEAN,
        allowNull: true,//false:不允许null
        // unique: true,     // 唯一约束
        defaultValue: true,
        comment: '是否显示为菜单'
    }

}, {
    tableName: 'menus',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   
    hooks: {
        afterSync: async (options) => {
            // 只在 force 模式下插入种子数据
            // if (options.force) {
            const count = await Menu.count();
            if (count === 0) {
                await Menu.bulkCreate(menusData);
                // 重置自增计数器，防止后续业务插入冲突
                const maxId = Math.max(...menusData.map(m => m.id));  // 6
                await DB.query(`ALTER TABLE menus AUTO_INCREMENT = ${maxId + 1}`);
                console.log('✅ Menu 种子数据已插入');
            }
            // }
        }
    }
});



module.exports = Menu;