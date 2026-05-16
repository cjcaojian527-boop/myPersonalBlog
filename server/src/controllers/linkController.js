// 本文件是友情链接的控制器，负责友链的增删改查操作
const { FriendLink } = require('../models');

// 获取所有友情链接（按排序权重升序排列）
exports.list = async (req, res) => {
  // try-catch 保护数据库查询操作
  try {
    // 按 sortOrder 升序排列，数字越小越靠前，用于控制友链展示顺序
    const links = await FriendLink.findAll({ order: [['sortOrder', 'ASC']] });
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: '获取友链失败' });
  }
};

// 添加新友链
exports.create = async (req, res) => {
  // try-catch 保护数据库写入操作
  try {
    // name      - 友链名称（如对方博客名称，必填）
    // url       - 友链地址（必填）
    // sortOrder - 排序权重（可选，默认为0）
    const { name, url, sortOrder } = req.body;
    // 名称和链接为必填项，防止空数据写入数据库
    if (!name || !url) return res.status(400).json({ message: '名称和链接不能为空' });
    const link = await FriendLink.create({ name, url, sortOrder: sortOrder || 0 });
    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ message: '添加友链失败' });
  }
};

// 更新友链信息
exports.update = async (req, res) => {
  // try-catch 保护友链查找和更新操作
  try {
    const { id } = req.params;
    const link = await FriendLink.findByPk(id);
    if (!link) return res.status(404).json({ message: '友链不存在' });
    const { name, url, sortOrder } = req.body;
    await link.update({ name, url, sortOrder });
    res.json(link);
  } catch (err) {
    res.status(500).json({ message: '更新友链失败' });
  }
};

// 删除友链
exports.remove = async (req, res) => {
  // try-catch 保护删除操作
  try {
    const { id } = req.params;
    const link = await FriendLink.findByPk(id);
    if (!link) return res.status(404).json({ message: '友链不存在' });
    await link.destroy();
    res.json({ message: '友链已删除' });
  } catch (err) {
    res.status(500).json({ message: '删除友链失败' });
  }
};
