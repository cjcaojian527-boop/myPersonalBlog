const { Sequelize, DataTypes } = require('sequelize');
const { DB } = require('../config/database');
// const { userinfo } = require('../config');
const defaultuserData = require('../seeds/touristsUser');


// sequelize

const Tourists = DB.define('Tourists', {
    nickName: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '昵称'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '邮箱'
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '头像'
    },
    likeStrings: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '点赞文章'
    },
    viewStrings: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '预览文章'
    },
    collects: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '收藏量'
    },
    focus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '关注博主量'
    },
    ClientIp: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        defaultValue: '未知',
        comment: 'ip属地'
    },
    commentLikeStrings: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '点赞评论'
    },
    navigator: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: 'navigator'
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '是否禁言'
    },
    isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: '是否系统账户'
    }
}, {
    tableName: 'Tourists',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   
    hooks: {
        afterSync: async (options) => {
            // 只在 force 模式下插入种子数据
            // if (options.force) {
            const count = await Tourists.count();
            if (count === 0) {
                await Tourists.bulkCreate(defaultuserData);
                // 重置自增计数器，防止后续业务插入冲突
                const maxId = Math.max(...defaultuserData.map(m => m.id));  // 6
                await DB.query(`ALTER TABLE Tourists AUTO_INCREMENT = ${maxId + 1}`);
                console.log('✅ Tourists 种子数据已插入');
            }
            // }
        }
    }
});

module.exports = Tourists;