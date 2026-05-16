// 本文件是文章（博文）的控制器，负责文章的增删改查、搜索和归档功能
const { Op } = require('sequelize');
const { Article, Category, Tag, User } = require('../models');

// 根据标题生成 URL 友好的 slug（如 "Hello World" => "hello-world"）
// 用于文章的 SEO 友好链接，同时防止中文标题导致 URL 编码问题
function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')        // 空格替换为连字符
    .replace(/[^\w\-]+/g, '')    // 移除非单词字符（中文等）
    .replace(/\-\-+/g, '-')      // 合并多个连字符
    .replace(/^-+/, '')          // 去除开头连字符
    .replace(/-+$/, '');         // 去除末尾连字符
}

// 获取文章列表（支持分页、排序、按分类/标签/状态筛选）
exports.list = async (req, res) => {
  // try-catch 保护数据库查询和分页计算，防止参数错误或数据库异常
  try {
    // 从查询字符串中解析分页和筛选参数
    // page       - 当前页码，默认第1页
    // pageSize   - 每页条数，默认10条
    // sort       - 排序字段，默认按创建时间
    // order      - 排序方向 ASC 正序 / DESC 倒序，默认倒序
    // categoryId - 按分类 ID 筛选文章
    // tagId      - 按标签 ID 筛选文章
    // status     - 按状态筛选（draft 草稿 / published 已发布）
    const { page = 1, pageSize, sort = 'createdAt', order = 'DESC', categoryId, tagId, status } = req.query;
    const limit = parseInt(pageSize) || 10;
    // offset 计算公式：(当前页 - 1) × 每页条数，实现数据库层面的分页偏移
    const offset = (parseInt(page) - 1) * limit;
    const where = {};
    if (status) where.status = status;           // 如果传了状态参数，按状态筛选
    if (categoryId) where.categoryId = categoryId; // 如果传了分类ID，按分类筛选

    // include 定义关联查询，同时查出文章的分类、标签、作者信息，避免 N+1 查询
    const include = [
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      // through: { attributes: [] } 表示不返回中间表的字段，只返回标签本身
      { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
      { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
    ];

    // 如果传了 tagId 参数，在标签关联查询中添加筛选条件（只查拥有该标签的文章）
    if (tagId) {
      include[1].where = { id: tagId };
    }

    // 白名单校验排序字段，防止 SQL 注入或使用未定义的列排序
    const allowedSort = ['createdAt', 'viewCount', 'likeCount'];
    const sortField = allowedSort.includes(sort) ? sort : 'createdAt';

    // findAndCountAll 一次查询同时返回数据行和总数，用于前端分页组件
    // distinct: true 防止在关联查询中因 JOIN 导致 count 计数不准确
    const { count, rows } = await Article.findAndCountAll({
      where,
      include,
      order: [[sortField, order]],
      limit,
      offset,
      distinct: true,
    });

    // 返回标准分页响应结构，前端可用于渲染分页导航
    res.json({
      list: rows,                              // 当前页文章数据
      total: count,                            // 符合条件的文章总数
      page: parseInt(page),                    // 当前页码
      pageSize: limit,                         // 每页条数
      totalPages: Math.ceil(count / limit),    // 总页数（向上取整）
    });
  } catch (err) {
    res.status(500).json({ message: '获取文章列表失败', error: err.message });
  }
};

// 获取文章详情
exports.detail = async (req, res) => {
  // try-catch 保护文章查询、浏览量自增、前后篇查询等多个异步操作
  try {
    // 从路由参数中获取文章 ID（如 /articles/:id）
    const { id } = req.params;
    // findByPk 通过主键查找文章，同时关联查询分类、标签、作者
    const article = await Article.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
    });
    // 如果文章不存在，返回 404 防止后续代码操作 null 对象
    if (!article) return res.status(404).json({ message: '文章不存在' });

    // 浏览量 +1 改为单独接口，避免 StrictMode 双重渲染导致 +2

    // 获取上一篇已发布文章：查找 ID 小于当前文章的最大 ID
    const prev = await Article.findOne({
      where: { id: { [Op.lt]: article.id }, status: 'published' },
      order: [['id', 'DESC']],
      attributes: ['id', 'title', 'slug'],
    });
    // 获取下一篇已发布文章：查找 ID 大于当前文章的最小 ID
    const next = await Article.findOne({
      where: { id: { [Op.gt]: article.id }, status: 'published' },
      order: [['id', 'ASC']],
      attributes: ['id', 'title', 'slug'],
    });

    // 返回文章详情 + 前后篇导航信息
    res.json({ ...article.toJSON(), prev, next });
  } catch (err) {
    res.status(500).json({ message: '获取文章详情失败', error: err.message });
  }
};

// 创建新文章（需要登录，通过 JWT 认证中间件获取 req.user）
exports.create = async (req, res) => {
  // try-catch 保护文章创建和标签关联操作
  try {
    // 解构请求体中的字段
    // tagIds 为标签 ID 数组，用于关联文章和标签的多对多关系
    // coverImage 为封面图片 URL
    // status 默认为 draft（草稿），可选 published（直接发布）
    const { title, content, summary, categoryId, tagIds, coverImage, status } = req.body;
    // 标题非空校验——如果标题为空或只有空格则拒绝
    if (!title || !title.trim()) return res.status(400).json({ message: '标题不能为空' });
    // 正文非空校验——文章没有内容无法发布
    if (!content) return res.status(400).json({ message: '正文不能为空' });

    // 生成唯一 slug：标题转 slug + 时间戳，确保 URL 唯一性
    const slug = slugify(title) + '-' + Date.now();
    const article = await Article.create({
      title: title.trim(),
      slug,
      content,
      // summary 如果不填，自动从 content 中提取前 150 个字符作为摘要（并去除 Markdown 标记字符）
      summary: summary || content.replace(/[#*`>\-\s]/g, '').substring(0, 150),
      categoryId,
      coverImage,
      status: status || 'draft',
      authorId: req.user.id, // 从 JWT 中获取当前登录用户 ID 作为作者
    });

    // 如果传了标签 ID 数组，通过 Sequelize 多对多关联方法 setTags 建立关联
    if (tagIds && tagIds.length > 0) {
      await article.setTags(tagIds);
    }

    res.status(201).json({ message: '文章创建成功', article });
  } catch (err) {
    res.status(500).json({ message: '创建文章失败', error: err.message });
  }
};

// 更新文章
exports.update = async (req, res) => {
  // try-catch 保护文章查找和更新操作
  try {
    const { id } = req.params;
    // 先查找文章是否存在，不存在返回 404
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: '文章不存在' });

    const { title, content, summary, categoryId, tagIds, coverImage, status } = req.body;
    // 更新操作采用"有则更新、无则保留原值"的策略，即部分更新（PATCH 语义）
    await article.update({
      title: title ? title.trim() : article.title,
      content: content || article.content,
      summary: summary || article.summary,
      categoryId: categoryId || article.categoryId,
      // coverImage 支持传空字符串来清除封面，所以用 !== undefined 判断
      coverImage: coverImage !== undefined ? coverImage : article.coverImage,
      status: status || article.status,
    });

    // 如果传了 tagIds（包括空数组），更新标签关联
    if (tagIds) {
      await article.setTags(tagIds);
    }

    res.json({ message: '文章更新成功', article });
  } catch (err) {
    res.status(500).json({ message: '更新文章失败', error: err.message });
  }
};

// 删除文章
exports.remove = async (req, res) => {
  // try-catch 保护删除操作，防止因级联删除或数据库约束导致的异常
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: '文章不存在' });
    // destroy 方法会删除文章记录，同时 Sequelize 会根据模型关联自动处理中间表数据
    await article.destroy();
    res.json({ message: '文章已删除' });
  } catch (err) {
    res.status(500).json({ message: '删除文章失败', error: err.message });
  }
};

// 搜索文章（全文搜索标题、摘要、正文，仅搜索已发布的文章）
exports.search = async (req, res) => {
  // try-catch 保护搜索查询和分页逻辑
  try {
    // keyword - 搜索关键词，必传
    const { keyword, page = 1, pageSize = 10 } = req.query;
    // 关键词为空则返回 400，避免空字符串导致全表查询
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    // 使用 Sequelize 的 Op.or 和 Op.like 实现多字段模糊匹配
    // %keyword% 表示包含关键词即可，效率较低但满足博客小数据量场景
    const { count, rows } = await Article.findAndCountAll({
      where: {
        status: 'published', // 只搜索已发布的文章
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { summary: { [Op.like]: `%${keyword}%` } },
          { content: { [Op.like]: `%${keyword}%` } },
        ],
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } },
        { model: User, as: 'author', attributes: ['id', 'username', 'nickname', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ message: '搜索失败', error: err.message });
  }
};

// 获取文章归档（按年月分组统计已发布文章）
exports.archive = async (req, res) => {
  // try-catch 保护数据库查询和数据分组处理
  try {
    // 只查询已发布的文章，仅取必要字段减少数据传输量
    // raw: true 返回纯 JSON 对象而非 Sequelize 实例，减少内存开销
    const articles = await Article.findAll({
      where: { status: 'published' },
      attributes: ['id', 'title', 'slug', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    // 按年份和月份分组，构建归档结构
    const archive = {};
    articles.forEach(a => {
      const year = new Date(a.createdAt).getFullYear();
      const month = new Date(a.createdAt).getMonth() + 1; // getMonth() 返回 0-11，需要 +1
      const key = `${year}年${month}月`; // 如 "2024年3月"
      if (!archive[key]) archive[key] = [];
      archive[key].push(a);
    });

    // 将分组对象转为数组，方便前端渲染
    const result = Object.entries(archive).map(([date, items]) => ({ date, count: items.length, articles: items }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '获取归档失败', error: err.message });
  }
};

// 浏览量 +1，前端仅在组件真正挂载时调用一次，避免 StrictMode 双重渲染导致 +2
exports.view = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ message: '文章不存在' });
    await article.increment('viewCount');
    res.json({ viewCount: article.viewCount + 1 });
  } catch (err) {
    res.status(500).json({ message: '浏览量更新失败' });
  }
};
