const { DataTypes } = require('sequelize');
const { DB } = require('../config/database');



const Article_Labels = DB.define("article_labels", {
    articleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '文章id'
    },
    labelId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '标签id'
    }
}, {
    tableName: "article_labels",
    freezeTableName: true
});



module.exports = Article_Labels;