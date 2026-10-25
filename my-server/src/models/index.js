const { DB } = require('../config/database');
const User = require('./User');
const ArticleList = require('./ArticleList');
const ArticleType = require('./ArticleType');
const Context = require('./context');
const labels = require('./labels');
const Article_Labels = require('./article_labels');

const TouristsUser = require('./touristsUser');
const Comments = require('./Comment');

const Menu = require('./Menu');

//创建关联
User.hasMany(ArticleList, { foreignKey: "userId" });
ArticleList.belongsTo(User, { foreignKey: "userId" });



ArticleType.hasMany(ArticleList, { foreignKey: "articleType", sourceKey: "typeId" });
ArticleList.belongsTo(ArticleType, { foreignKey: "articleType", targetKey: "typeId" });

TouristsUser.hasMany(Comments, { foreignKey: 'tId' });
Comments.belongsTo(TouristsUser, { foreignKey: "tId", onDelete: "SET NULL" });

User.hasMany(Comments, { foreignKey: 'uId' });
Comments.belongsTo(User, { foreignKey: "uId", onDelete: "SET NULL" });

ArticleList.hasMany(Comments, { foreignKey: 'articleId', onDelete: "CASCADE" });
Comments.belongsTo(ArticleList, { foreignKey: "articleId" });

ArticleList.hasMany(Context, { foreignKey: "articleId", onDelete: "CASCADE" });
Context.belongsTo(ArticleList, { foreignKey: "articleId" });

ArticleList.belongsToMany(labels, { through: 'article_labels', foreignKey: 'articleId', otherKey: 'labelId' });
labels.belongsToMany(ArticleList, { through: 'article_labels', foreignKey: 'labelId', otherKey: 'articleId' });

const models = { User, ArticleList, ArticleType, TouristsUser, Context, labels, Article_Labels, Menu, Comments, TouristsUser };

//同步
const syncModel = async (flag) => {

    try {
        if (flag) {
            //将创建表,如果表已经存在,则将其首先删除
            await DB.sync({ force: true });
            return;
        }
        // await DB.query('SET FOREIGN_KEY_CHECKS = 0');   // ← 加这行：暂时关闭外键约束检查

        // await DB.query('SET FOREIGN_KEY_CHECKS = 1');   // ← 加这行：恢复外键约束检查

        // ⚠️ 顺序很重要：被外键引用的表必须先建，否则报 "Failed to open the referenced table"
        // 第 1 层：基础表（不依赖任何表）
        await User.sync({ hooks: true });
        await ArticleType.sync();
        await TouristsUser.sync({ hooks: true});
        await labels.sync({ hooks: true });

        // 第 2 层：依赖 users + ArticleTypes
        await ArticleList.sync();

        // 第 3 层：依赖 ArticleList（及 Tourists / Users / Labels）
        await Comments.sync();
        await Context.sync();
        await Article_Labels.sync();

        // 独立表
        await Menu.sync({ hooks: true });
    } catch (error) {
        console.error('模型同步出错：' + error.message);
        throw error;
    }

}



module.exports = { ...models, syncModel };

//User.sync() - 如果表不存在,则创建该表(如果已经存在,则不执行任何操作)
// User.sync({ force: true }) - 将创建表,如果表已经存在,则将其首先删除
// User.sync({ alter: true }) - 这将检查数据库中表的当前状态(它具有哪些列,它们的数据类型等),然后在表中进行必要的更改以使其与模型匹配.