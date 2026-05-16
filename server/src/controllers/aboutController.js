// 本文件是"关于我"页面信息的控制器，负责获取和更新个人简介/关于页面内容
const { About } = require('../models');

// 获取"关于我"信息
exports.get = async (req, res) => {
  // try-catch 保护数据库查询操作，防止查询异常导致进程崩溃
  try {
    // 查询 About 表中的唯一一条记录（单页网站通常只有一条"关于"信息）
    const about = await About.findOne();
    // 如果数据库中有记录则返回，否则返回空的 content 字段，避免前端报错
    res.json(about || { content: '' });
  } catch (err) {
    // 捕获所有数据库查询异常，如连接失败、表不存在等
    res.status(500).json({ message: '获取关于信息失败' });
  }
};

// 更新"关于我"信息
exports.update = async (req, res) => {
  // try-catch 保护 upsert（插入或更新）操作
  try {
    // 从请求体中解构出 content 字段（用户提交的"关于我"文本内容）
    const { content } = req.body;
    // upsert 方法：如果 id=1 的记录存在则更新 content，不存在则创建新记录
    // 返回值是一个数组 [实例, 是否新建]，这里只取实例
    const [about] = await About.upsert({ id: 1, content });
    res.json(about);
  } catch (err) {
    // 捕获 upsert 过程中的数据库异常
    res.status(500).json({ message: '更新关于信息失败' });
  }
};
