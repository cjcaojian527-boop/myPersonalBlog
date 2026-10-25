const Article = require('../models/ArticleList');
const { siteInfo } = require('../config');

// 计算某个日期距今多少天
const diffDays = (date) => {
    const ms = Date.now() - new Date(date).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

// 把天数格式化成「今天 / 昨天 / X天前 / X个月前 / X年前」
const formatAgo = (days) => {
    if (days <= 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
};

// 获取站点统计信息（前台展示用）
exports.getSiteStats = async (req, res) => {
    try {
        // 访问总数 / 总访客数：来自内存计数器
        const stats = global.siteStats || { totalVisits: 0, totalVisitors: 0 };

        // 建站天数：当前时间 - config 里配置的建站日期
        const daysSinceCreation = diffDays(siteInfo.startDate);

        // 最后更新：取文章表里 updatedAt 最新的一条
        const latest = await Article.findOne({
            order: [['updatedAt', 'DESC']],
            attributes: ['updatedAt'],
        });
        const lastUpdateDays = latest ? diffDays(latest.updatedAt) : 0;

        res.json({
            code: 0,
            message: '获取成功',
            data: {
                totalVisits: stats.totalVisits,             // 访问总数
                totalVisitors: stats.totalVisitors,         // 总访客数
                daysSinceCreation,                          // 建站天数
                lastUpdateDays,                             // 最后更新距今天数
                lastUpdateText: formatAgo(lastUpdateDays),  // 「20天前」
                lastUpdateAt: latest ? latest.updatedAt : null, // 原始时间，前端可自行格式化
            }
        });

    } catch (error) {
        console.error('获取站点统计失败:', error.message);
        res.status(500).json({ code: -1, message: '获取失败: ' + error.message });
    }
};
