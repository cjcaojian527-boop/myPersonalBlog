// 本文件是文章标签的控制器，负责标签的查询、创建和删除操作
const { Tag, Article } = require('../models');

// 获取所有标签列表（附带每个标签下的已发布文章数量）
exports.list = async (req, res) => {
  // try-catch 保护数据库查询操作
  try {
    // 查询所有标签，同时关联已发布文章用于统计数量
    // required: false 使用 LEFT JOIN，即使标签下无文章也会返回该标签
    const tags = await Tag.findAll({
      include: [{ model: Article, as: 'articles', attributes: ['id'], where: { status: 'published' }, required: false }],
      order: [['id', 'ASC']],
    });
    // 为每个标签附加 articleCount，方便前端展示标签对应的文章数量
    const result = tags.map(t => ({
      ...t.toJSON(),
      articleCount: t.articles ? t.articles.length : 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '获取标签失败', error: err.message });
  }
};

// 创建标签（如果已存在同名标签则直接返回已有的）
exports.create = async (req, res) => {
  // try-catch 保护标签查找或创建操作
  try {
    // name - 标签名称（必填）
    // slug - URL 友好的标识符（可选，不填则根据名称自动生成）
    const { name, slug } = req.body;
    if (!name) return res.status(400).json({ message: '标签名称不能为空' });
    // findOrCreate 方法：先按 name 查找，如果存在则直接返回（不重复创建）
    // defaults 仅在新建时使用，用于提供默认 slug
    const [tag] = await Tag.findOrCreate({
      where: { name },
      defaults: { slug: slug || name.toLowerCase().replace(/\s+/g, '-') },
    });
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ message: '创建标签失败', error: err.message });
  }
};

// 删除标签（注意：通过 Sequelize 多对多关联，删除标签会自动清除中间表关联）
exports.remove = async (req, res) => {
  // try-catch 保护删除操作
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) return res.status(404).json({ message: '标签不存在' });
    // destroy 会删除标签记录，Sequelize 会自动处理 ArticleTag 中间表的外键关系
    await tag.destroy();
    res.json({ message: '标签已删除' });
  } catch (err) {
    res.status(500).json({ message: '删除标签失败', error: err.message });
  }
};
