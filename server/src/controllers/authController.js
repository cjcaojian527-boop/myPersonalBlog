// 本文件是用户认证的控制器，负责用户注册、登录、获取个人信息和更新个人资料
const bcrypt = require('bcryptjs'); // bcryptjs：用于密码加盐哈希，保护用户密码安全
const jwt = require('jsonwebtoken'); // jsonwebtoken：用于生成和验证 JWT 令牌
const config = require('../config'); // 导入 JWT 密钥和过期时间等配置
const { User } = require('../models');

// 用户注册
exports.register = async (req, res) => {
  // try-catch 保护注册全流程（用户名查重、密码加密、创建用户、生成令牌）
  try {
    // username 登录用户名，password 明文密码，nickname 显示昵称（可选，默认使用用户名）
    const { username, password, nickname } = req.body;
    // 检查用户名是否已存在，防止重复注册
    const exist = await User.findOne({ where: { username } });
    if (exist) return res.status(400).json({ message: '用户名已存在' });
    // 使用 bcrypt 对密码进行加盐哈希（强度 10 轮），存储到数据库的是哈希值而非明文
    const hashed = await bcrypt.hash(password, 10);
    // 创建用户，默认角色为 admin（博客系统通常只有一个管理员/作者）
    const user = await User.create({ username, password: hashed, nickname: nickname || username, role: 'admin' });
    // 注册成功后自动签发 JWT，无需再登录
    // JWT payload 包含用户 id、username、role，后续通过中间件解析到 req.user
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,           // JWT 签名密钥，存储在配置文件中
      { expiresIn: config.jwt.expiresIn } // 令牌过期时间
    );
    // 返回令牌和用户信息（不包含密码）
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role } });
  } catch (err) {
    // 捕获注册过程中的所有异常（数据库错误、bcrypt 错误等）
    res.status(500).json({ message: '注册失败', error: err.message });
  }
};

// 用户登录
exports.login = async (req, res) => {
  // try-catch 保护登录流程（用户查找、密码比对、令牌生成）
  try {
    const { username, password } = req.body;
    // 根据用户名查找用户
    const user = await User.findOne({ where: { username } });
    // 使用模糊提示"用户名或密码错误"，不泄露用户是否存在的信息（安全最佳实践）
    if (!user) return res.status(400).json({ message: '用户名或密码错误' });
    // bcrypt.compare 将用户传入的明文密码与数据库中的哈希值进行比对
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: '用户名或密码错误' });
    // 密码验证通过后签发 JWT 令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    // 登录成功，返回令牌和用户信息（包含头像等更多字段）
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: '登录失败', error: err.message });
  }
};

// 获取当前登录用户信息（用于前端验证令牌有效性和获取最新用户数据）
exports.me = async (req, res) => {
  // try-catch 保护用户查询操作
  try {
    // req.user.id 由 JWT 认证中间件解析令牌后注入
    // attributes: { exclude: ['password'] } 确保不会将密码哈希返回给前端
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: '用户不存在' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '获取用户信息失败' });
  }
};

// 更新用户个人资料（昵称、头像）
exports.updateProfile = async (req, res) => {
  // try-catch 保护数据库更新操作
  try {
    // 目前只支持更新昵称和头像，密码等敏感信息通过专门接口处理
    const { nickname, avatar } = req.body;
    // 按当前登录用户 ID 更新数据，确保用户只能修改自己的资料
    await User.update({ nickname, avatar }, { where: { id: req.user.id } });
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失败' });
  }
};
