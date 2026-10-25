const { DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const { userinfo } = require('../config');



const article = DB.define('ArticleList', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        unique: true,     // 唯一约束
        comment: '文章标题'
    },
    articleType: {
        type: DataTypes.UUID,
        allowNull: false,//不允许null
        comment: '文章分类ID'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,//不允许null
        comment: '作者ID'
    },
    coverImage: {
        type: DataTypes.STRING,
        allowNull: true,//false:不允许null
        defaultValue: '',
        comment: '封面图'
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: true,//false:不允许null
        defaultValue: 0,
        comment: '点赞量'
    },
    ClientIp: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        defaultValue: '未知',
        comment: 'ip属地'
    },
    collects: {
        type: DataTypes.INTEGER,
        allowNull: true,//false:不允许null
        defaultValue: 0,
        comment: '收藏量'
    },
    isTop: {
        type: DataTypes.BOOLEAN,
        allowNull: true,//false:不允许null
        defaultValue: false,
        comment: '是否置顶'
    },
    // labelId: {
    //     type: DataTypes.UUID,
    //     allowNull: false,//不允许null
    //     comment: '标签ID'
    // },
    // contextId: {
    //     type: DataTypes.STRING,
    //     allowNull: false,//不允许null
    //     unique: true,     // 唯一约束
    //     comment: '内容ID'
    // }
}, {
    tableName: 'ArticleList',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   

});


module.exports = article;