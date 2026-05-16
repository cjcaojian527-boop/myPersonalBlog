// 本文件是文章分类的控制器，负责分类的增删改查操作
const { Category, Article } = require('../models');

// 获取所有分类列表（附带每个分类下的已发布文章数量）
exports.list = async (req, res) => {
  // try-catch 保护数据库查询操作
  try {
    // 查询所有分类，同时关联查询已发布的文章用于统计数量
    // required: false 表示使用 LEFT JOIN，即使分类下没有文章也会返回该分类
    // status: 'published' 只统计已发布的文章，草稿不计入
    const categories = await Category.findAll({
      include: [{ model: Article, as: 'articles', attributes: ['id'], where: { status: 'published' }, required: false }],
      order: [['sortOrder', 'ASC']], // 按排序字段升序排列，用于前端自定义分类显示顺序
    });
    // 为每个分类附加 articleCount 字段，方便前端直接展示
    const result = categories.map(c => ({
      ...c.toJSON(),
      articleCount: c.articles ? c.articles.length : 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '获取分类失败', error: err.message });
  }
};

// 创建新分类
exports.create = async (req, res) => {
  // try-catch 保护分类创建操作
  try {
    // name        - 分类名称（必填）
    // slug        - URL 友好的标识符（可选，不填则根据名称自动生成）
    // description - 分类描述（可选）
    // sortOrder   - 排序权重（可选，默认为0，数字越小越靠前）
    const { name, slug, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ message: '分类名称不能为空' });
    // 检查分类名是否已存在，防止重复创建
    const exist = await Category.findOne({ where: { name } });
    if (exist) return res.status(400).json({ message: '该分类已存在' });
    const category = await Category.create({
      name,
      // slug 自动生成规则：将名称转为小写并用连字符替换空格（如 "前端技术" => "前端技术"）
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      sortOrder: sortOrder || 0,
    });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: '创建分类失败', error: err.message });
  }
};

// 更新分类
exports.update = async (req, res) => {
  // try-catch 保护分类查找和更新操作
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: '分类不存在' });
    const { name, slug, description, sortOrder } = req.body;
    // 如果要修改名称，先检查新名称是否与其他分类冲突（排除自身）
    if (name && name !== category.name) {
      const exist = await Category.findOne({ where: { name } });
      if (exist) return res.status(400).json({ message: '该分类名称已存在' });
    }
    await category.update({ name, slug, description, sortOrder });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: '更新分类失败', error: err.message });
  }
};

// 删除分类
exports.remove = async (req, res) => {
  // try-catch 保护分类删除和外键约束检查
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ message: '分类不存在' });
    // 删除前检查该分类下是否还有文章，防止外键约束错误或文章丢失
    const count = await Article.count({ where: { categoryId: id } });
    if (count > 0) return res.status(400).json({ message: `该分类下还有 ${count} 篇文章，请先迁移` });
    await category.destroy();
    res.json({ message: '分类已删除' });
  } catch (err) {
    res.status(500).json({ message: '删除分类失败', error: err.message });
  }
};
