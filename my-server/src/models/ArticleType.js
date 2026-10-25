const { DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const defaultTypes = require('../seeds/articleTypes');

const Types = DB.define('ArticleTypes', {
    typeName: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '分类标题'
    },
    typeId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束

    }
}, {
    tableName: 'ArticleTypes',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   
    hooks: {
        afterSync: async (options) => {
            // 只在 force 模式下插入种子数据
            // if (options.force) {
            const count = await Types.count();
            if (count === 0) {
                await Types.bulkCreate(defaultTypes);
                // 重置自增计数器，防止后续业务插入冲突
                const maxId = Math.max(...defaultTypes.map(m => m.id));  // 6
                await DB.query(`ALTER TABLE ArticleTypes AUTO_INCREMENT = ${maxId + 1}`);
                console.log('✅ ArticleTypes 种子数据已插入');
            }
            // }
        }
    }
});

module.exports = Types;