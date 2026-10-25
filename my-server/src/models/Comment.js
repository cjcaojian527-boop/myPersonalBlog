const { Sequelize, DataTypes } = require('sequelize');
const { DB } = require('../config/database');
const { commentStatus } = require('../config');
// const defaultuserData = require('../seeds/users');


// sequelize

const Comments = DB.define('Comments', {
    tId: {
        type: DataTypes.INTEGER,
        allowNull: true,//不允许null
        defaultValue: null,
        comment: '游客ID'
    },
    uId: {
        type: DataTypes.INTEGER,
        allowNull: true,//不允许null
        defaultValue: null,
        comment: '作者ID'
    },
    ClientIp: {
        type: DataTypes.STRING,
        allowNull: false,//不允许null
        comment: 'ip属地'
    },
    articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,//不允许null
        comment: '文章ID'
    },
    context: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        comment: '评论内容'
    },
    likes: {
        type: DataTypes.INTEGER,
        allowNull: true,//false:不允许null
        defaultValue: 0,
        comment: '点赞量'
    },

    Commentobject: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: -1,
        comment: '评论对象',//对文章评论或者对评论评论
    },
    CommentStatus: {
        type: DataTypes.ENUM(commentStatus),
        // allowNull: false,
        defaultValue: 'approved',
        comment: '审核状态'
    }

}, {
    tableName: 'Comments',           // 自定义表名（不自动复数）
    freezeTableName: true,        // 禁止自动复数化，表名 = 模型名   

});

module.exports = Comments;