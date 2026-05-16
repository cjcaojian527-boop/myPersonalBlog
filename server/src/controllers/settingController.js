// 本文件是网站设置的控制器，负责获取和更新站点全局配置（如站点名称、描述等键值对）
const { Setting } = require('../models');

// 获取所有网站设置（返回 key-value 键值对对象）
exports.get = async (req, res) => {
  // try-catch 保护数据库查询操作
  try {
    // 查出所有设置项，然后转换为 { key1: value1, key2: value2 } 格式，方便前端直接使用
    const settings = await Setting.findAll();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: '获取设置失败' });
  }
};

// 更新或新增一项网站设置
exports.update = async (req, res) => {
  // try-catch 保护 upsert 操作
  try {
    // key   - 设置项的键名（如 siteName、siteDescription，必填）
    // value - 设置项的值（如 "我的博客"、"记录生活的点点滴滴"）
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: '缺少设置项key' });
    // upsert 方法：如果 key 已存在则更新 value，不存在则创建新记录
    await Setting.upsert({ key, value });
    res.json({ message: '设置已更新' });
  } catch (err) {
    res.status(500).json({ message: '更新设置失败' });
  }
};
