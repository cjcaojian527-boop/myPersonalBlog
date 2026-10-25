const { Op, QueryTypes } = require('sequelize');
const { DB } = require('../config/database');

// 加载模型索引，确保所有关联关系已建立
require('../models');

const Article = require('../models/ArticleList');
const Comment = require('../models/Comment');
const Tourists = require('../models/touristsUser');
const User = require('../models/User');
const Types = require('../models/ArticleType');
const Labels = require('../models/labels');

// ==================== 工具函数 ====================

// 把 Date 格式化成 YYYY-MM-DD
const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// 数字兜底：null / undefined / 字符串数字 统一转成 Number
// （MySQL 的 COUNT 返回的是 BIGINT，驱动可能给字符串，必须转）
const num = (v) => Number(v) || 0;

// 把 [{date, count}] 转成 { '2026-09-17': 5 } 方便查
const toCountMap = (rows) => {
    const map = {};
    rows.forEach(r => { map[r.date] = num(r.count); });
    return map;
};

// 把 [{name, value}] 里的 value 转成数字
const toNameValue = (rows) => rows.map(r => ({ name: r.name, value: num(r.value) }));

// 评论状态英文 → 中文
const STATUS_TEXT = { approved: '通过', pending: '待审核', rejected: '已拒绝' };


// ==================== 数据大屏：一次性返回全部数据 ====================
exports.getDashboard = async (req, res) => {
    try {
        // 趋势图天数：默认 30，限制在 1~365 之间
        const days = Math.min(Math.max(Number(req.body?.trendDays) || 30, 1), 365);

        // 今天 0 点（统计「今日新增」用）
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 趋势图起始日期（含今天）
        const trendStart = new Date(todayStart);
        trendStart.setDate(trendStart.getDate() - (days - 1));

        // ==================== 并行执行所有查询 ====================
        const [
            // ① 概览数字
            articleCount, commentCount, touristCount, userCount,
            typeCount, labelCount,
            pendingComments, approvedComments, rejectedComments,
            bannedTourists, topArticleCount,
            todayArticles, todayComments, todayTourists,
            likesSum, collectsSum,
            // ② 趋势
            trendArticleRows, trendCommentRows, trendTouristRows,
            // ③ 活跃时段
            hourlyRows,
            // ④ 分布
            categoryDistRows, commentStatusRows, locationDistRows,
            // ⑤ 排行
            hotArticleRows, activeAuthorRows, labelUsageRows,
            // ⑥ 列表
            recentCommentRows, recentArticleRows,
        ] = await Promise.all([
            // ---------- ① 概览数字 ----------
            Article.count(),
            Comment.count(),
            Tourists.count(),
            User.count(),
            Types.count(),
            Labels.count(),
            Comment.count({ where: { CommentStatus: 'pending' } }),
            Comment.count({ where: { CommentStatus: 'approved' } }),
            Comment.count({ where: { CommentStatus: 'rejected' } }),
            Tourists.count({ where: { isBanned: true } }),
            Article.count({ where: { isTop: true } }),
            Article.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
            Comment.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
            Tourists.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
            Article.sum('likes').then(num),
            Article.sum('collects').then(num),

            // ---------- ② 趋势（按天分组）----------
            DB.query(
                `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS date, COUNT(*) AS count
                 FROM ArticleList WHERE createdAt >= :start GROUP BY date`,
                { replacements: { start: trendStart }, type: QueryTypes.SELECT }
            ),
            DB.query(
                `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS date, COUNT(*) AS count
                 FROM Comments WHERE createdAt >= :start GROUP BY date`,
                { replacements: { start: trendStart }, type: QueryTypes.SELECT }
            ),
            DB.query(
                `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS date, COUNT(*) AS count
                 FROM Tourists WHERE createdAt >= :start GROUP BY date`,
                { replacements: { start: trendStart }, type: QueryTypes.SELECT }
            ),

            // ---------- ③ 评论活跃时段（0-23 点）----------
            DB.query(
                `SELECT HOUR(createdAt) AS hour, COUNT(*) AS count
                 FROM Comments GROUP BY hour`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ④ 各分类文章数 ----------
            DB.query(
                `SELECT t.typeName AS name, COUNT(a.id) AS value
                 FROM ArticleList a
                 JOIN ArticleTypes t ON a.articleType = t.typeId
                 GROUP BY t.typeId, t.typeName
                 ORDER BY value DESC`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ④ 评论审核状态 ----------
            DB.query(
                `SELECT CommentStatus AS name, COUNT(*) AS value
                 FROM Comments GROUP BY CommentStatus`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ④ 评论属地分布（Top15）----------
            DB.query(
                `SELECT ClientIp AS name, COUNT(*) AS value
                 FROM Comments
                 WHERE ClientIp IS NOT NULL AND ClientIp <> ''
                 GROUP BY ClientIp
                 ORDER BY value DESC
                 LIMIT 15`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ⑤ 热门文章 Top10（按点赞）----------
            DB.query(
                `SELECT id, title AS name, likes, collects
                 FROM ArticleList
                 ORDER BY likes DESC, collects DESC
                 LIMIT 10`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ⑤ 活跃作者 Top10 ----------
            DB.query(
                `SELECT u.id, u.name, COUNT(a.id) AS value
                 FROM ArticleList a
                 JOIN users u ON a.userId = u.id
                 GROUP BY u.id, u.name
                 ORDER BY value DESC
                 LIMIT 10`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ⑤ 标签使用频率 Top10 ----------
            DB.query(
                `SELECT l.labelName AS name, COUNT(al.articleId) AS value
                 FROM article_labels al
                 JOIN Labels l ON al.labelId = l.labelId
                 GROUP BY l.labelId, l.labelName
                 ORDER BY value DESC
                 LIMIT 10`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ⑥ 最新评论 ----------
            DB.query(
                `SELECT c.id, c.context, c.ClientIp, c.createdAt,
                        t.nickName, a.title AS articleTitle
                 FROM Comments c
                 LEFT JOIN Tourists t ON c.tId = t.id
                 LEFT JOIN ArticleList a ON c.articleId = a.id
                 ORDER BY c.createdAt DESC
                 LIMIT 10`,
                { type: QueryTypes.SELECT }
            ),

            // ---------- ⑥ 最新文章 ----------
            DB.query(
                `SELECT a.id, a.title, a.createdAt,
                        u.name AS author, t.typeName
                 FROM ArticleList a
                 LEFT JOIN users u ON a.userId = u.id
                 LEFT JOIN ArticleTypes t ON a.articleType = t.typeId
                 ORDER BY a.createdAt DESC
                 LIMIT 10`,
                { type: QueryTypes.SELECT }
            ),
        ]);

        // ==================== 组装趋势数据（补零）====================
        // SQL 只返回「有数据」的日期，没数据的日期会缺失，必须补 0
        const dates = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(trendStart);
            d.setDate(d.getDate() + i);
            dates.push(fmtDate(d));
        }

        const articleMap = toCountMap(trendArticleRows);
        const commentMap = toCountMap(trendCommentRows);
        const touristMap = toCountMap(trendTouristRows);

        // ==================== 组装活跃时段 ====================
        const hourlyActivity = new Array(24).fill(0);
        hourlyRows.forEach(r => {
            const h = Number(r.hour);
            if (h >= 0 && h < 24) hourlyActivity[h] = num(r.count);
        });

        // ==================== 组装评论状态（转中文）====================
        const commentStatus = commentStatusRows.map(r => ({
            name: STATUS_TEXT[r.name] || r.name,
            value: num(r.value),
        }));

        // ==================== 返回 ====================
        res.json({
            code: 0,
            message: '获取成功',
            data: {
                // ① 概览数字
                overview: {
                    articleCount,       // 总文章数
                    commentCount,       // 总评论数
                    touristCount,       // 总游客数
                    userCount,          // 总后台用户数
                    typeCount,          // 总分类数
                    labelCount,         // 总标签数
                    pendingComments,    // 待审核评论
                    approvedComments,   // 已通过评论
                    rejectedComments,   // 已拒绝评论
                    bannedTourists,     // 被禁言游客
                    topArticleCount,    // 置顶文章数
                    todayArticles,      // 今日新增文章
                    todayComments,      // 今日新增评论
                    todayTourists,      // 今日新增游客
                    likesSum,           // 累计点赞量
                    collectsSum,        // 累计收藏量
                },

                // ② 趋势（折线图）：x 轴 dates，三条线
                trend: {
                    dates,
                    article: dates.map(d => articleMap[d] || 0),
                    comment: dates.map(d => commentMap[d] || 0),
                    tourist: dates.map(d => touristMap[d] || 0),
                },

                // ③ 分类分布（饼图）
                categoryDist: toNameValue(categoryDistRows),

                // ④ 评论审核状态（环形图）
                commentStatus,

                // ⑤ 属地分布（柱状图 / 地图）
                locationDist: toNameValue(locationDistRows),

                // ⑥ 评论活跃时段（24 根柱子）
                hourlyActivity,

                // ⑦ 热门文章 Top10
                hotArticles: hotArticleRows.map(r => ({
                    id: r.id,
                    name: r.name,
                    likes: num(r.likes),
                    collects: num(r.collects),
                })),

                // ⑧ 活跃作者 Top10
                activeAuthors: toNameValue(activeAuthorRows),

                // ⑨ 标签使用频率 Top10
                labelUsage: toNameValue(labelUsageRows),

                // ⑩ 最新评论
                recentComments: recentCommentRows,

                // ⑪ 最新文章
                recentArticles: recentArticleRows,
            }
        });

    } catch (error) {
        console.error('获取数据大屏失败:', error.message);
        res.status(500).json({ code: -1, message: '获取失败: ' + error.message });
    }
};
