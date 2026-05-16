// 本文件是点赞功能的控制器，负责点赞/取消点赞的切换和点赞状态查询
const { Like, Article } = require('../models');

// 切换点赞状态：如果已点赞则取消点赞，如果未点赞则新增点赞
exports.toggle = async (req, res) => {
  // try-catch 保护点赞/取消点赞的完整事务流程（查询、写入/删除、计数更新）
  try {
    // articleId - 要点赞的文章 ID（必填）
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ message: '缺少文章ID' });

    // 查询当前用户是否已经对这篇文章点过赞
    const exist = await Like.findOne({ where: { articleId, userId: req.user.id } });
    if (exist) {
      // 如果已点赞则取消：删除点赞记录，文章点赞数 -1
      await exist.destroy();
      // decrement 是 Sequelize 的原子递减方法，避免并发时的计数错误
      await Article.decrement('likeCount', { where: { id: articleId } });
      return res.json({ liked: false, message: '已取消点赞' });
    }

    // 未点赞则新增：创建点赞记录，文章点赞数 +1
    await Like.create({ articleId, userId: req.user.id });
    // increment 是 Sequelize 的原子递增方法
    await Article.increment('likeCount', { where: { id: articleId } });
    res.json({ liked: true, message: '点赞成功' });
  } catch (err) {
    res.status(500).json({ message: '操作失败', error: err.message });
  }
};

// 查询当前用户对某篇文章的点赞状态（用于前端判断点赞图标高亮）
exports.status = async (req, res) => {
  // try-catch 保护数据库查询操作
  try {
    // articleId - 要查询的文章 ID（必填，通过 query string 传递）
    const { articleId } = req.query;
    if (!articleId) return res.status(400).json({ message: '缺少文章ID' });
    // !! 将查询结果转为布尔值：找到记录则为 true，null 则为 false
    const liked = !!(await Like.findOne({ where: { articleId, userId: req.user.id } }));
    res.json({ liked });
  } catch (err) {
    res.status(500).json({ message: '查询失败' });
  }
};
