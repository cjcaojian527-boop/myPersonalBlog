const { DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const { userinfo } = require('../config');
const defaultuserData = require('../seeds/labels');

const Labels = DB.define('Labels', {
    labelName: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '标签标题'
    },
    labelId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,//不允许null
        primaryKey: true,
        // unique: true,     // 唯一约束

    }
}, {
    tableName: 'Labels',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   
    hooks: {
        afterSync: async (options) => {
            // 只在 force 模式下插入种子数据
            // if (options.force) {
            const count = await Labels.count();
            if (count === 0) {
                await Labels.bulkCreate(defaultuserData);
                // 重置自增计数器，防止后续业务插入冲突
                // const maxId = Math.max(...defaultuserData.map(m => m.id));  // 6
                // await DB.query(`ALTER TABLE labels AUTO_INCREMENT = ${maxId + 1}`);
                console.log('✅ labels 种子数据已插入');
            }
            // }
        }
    }

});

module.exports = Labels;