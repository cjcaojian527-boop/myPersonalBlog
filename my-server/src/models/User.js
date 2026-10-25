const { Sequelize, DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const { userinfo } = require('../config');
const defaultuserData = require('../seeds/users');


// sequelize

const User = DB.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '用户账号'
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: userinfo.defaultPassword,
        comment: '密码'
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '用户头像'
    },
    name_display: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '用户label'
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'temp_admin'),
        defaultValue: 'admin',
        comment: '角色'
    },

    describe: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
        comment: '用户描述'
    },
    isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否系统账号（不可删除）'
    }

}, {
    tableName: 'users',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   
    hooks: {
        afterSync: async (options) => {
            // 只在 force 模式下插入种子数据
            // if (options.force) {
            const count = await User.count();
            if (count === 0) {
                await User.bulkCreate(defaultuserData);
                // 重置自增计数器，防止后续业务插入冲突
                const maxId = Math.max(...defaultuserData.map(m => m.id));  // 6
                await DB.query(`ALTER TABLE users AUTO_INCREMENT = ${maxId + 1}`);
                console.log('✅ User 种子数据已插入');
            }
            // }
        }
    }
});

module.exports = User;