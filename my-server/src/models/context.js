const { Sequelize, DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const { ELEMNTTYPE } = require('../config');


const model = {
    label: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '内容标题'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        comment: '用户姓名'
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1,
        comment: '内容顺序'
    },
    elementType: {
        type: DataTypes.ENUM(Object.values(ELEMNTTYPE)),
        // allowNull: false,
        defaultValue: 'text',
        comment: '元素类型'
    },
    content: {
        type: DataTypes.TEXT,
        defaultValue: '',
        comment: '元素内容'

    },
    articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,//不允许null
        comment: '文章ID'
    },

}

const Context = DB.define("Context", model, {
    tableName: "context",
    freezeTableName: true,
});

module.exports = Context;
module.exports.model = Object.keys(model).filter(f => model[f].allowNull === false);
