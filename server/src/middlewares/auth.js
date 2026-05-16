/**
 * ============================================================
 * 文件名: auth.js
 * 用途: JWT 认证中间件 —— 验证请求是否携带有效的登录令牌
 *
 * 工作原理:
 * 1. 从 HTTP 请求头 Authorization 中提取 Bearer Token
 * 2. 使用 JWT 库验证 token 是否有效（签名是否正确、是否过期）
 * 3. 验证通过：将解码后的用户信息挂载到 req.user，放行请求
 * 4. 验证失败：返回 401 状态码，要求前端跳转到登录页
 *
 * 使用方式: 在需要登录才能访问的路由前加上此中间件
 *   例如: router.get('/profile', authMiddleware, handler)
 *
 * JWT (JSON Web Token) 简介:
 *   - 是一种无状态的认证令牌，由三部分组成：Header.Payload.Signature
 *   - 服务端用密钥（secret）签名，客户端在每次请求时携带
 *   - 不需要服务端存储 session，适合分布式部署
 * ============================================================
 */

const jwt = require('jsonwebtoken');  // JWT 库，用于生成和验证 JSON Web Token
const config = require('../config');  // 项目全局配置，包含 jwt.secret（签名密钥）和过期时间

/**
 * auth 中间件（默认导出）
 *
 * @param {Object} req  - Express 请求对象
 *   req.headers.authorization - HTTP 认证头，格式为 "Bearer <token>"
 * @param {Object} res  - Express 响应对象
 * @param {Function} next - Express 中间件回调，调用后进入下一个中间件或路由处理
 *
 * 认证流程:
 *   Step 1: 提取 token —— 从 Authorization 头中获取 Bearer 后面的内容
 *   Step 2: 基本校验 —— 检查 Authorization 头是否存在，格式是否正确
 *   Step 3: JWT 验证 —— 使用密钥验证 token 的签名和有效期
 *   Step 4: 挂载用户信息 —— 将解码后的 payload 挂到 req.user 供后续路由使用
 */
module.exports = (req, res, next) => {
  // ===== Step 1: 提取 Authorization 请求头 =====
  // 标准格式: "Bearer eyJhbGciOiJIUzI1NiIs..."
  // Bearer 是 OAuth 2.0 规定的 token 类型前缀
  const authHeader = req.headers.authorization;

  // ===== Step 2: 校验 token 是否存在且格式正确 =====
  // 两种情况直接拒绝:
  //   1) 请求头中没有 Authorization 字段（未登录）
  //   2) Authorization 的值不是以 "Bearer " 开头（格式错误）
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 返回 401 Unauthorized，提示前端用户需要登录
    return res.status(401).json({ message: '请先登录' });
  }

  // ===== Step 3: 提取纯 token 字符串 =====
  // authHeader 格式: "Bearer xxxxx.yyyyy.zzzzz"
  // split(' ') 后得到 ['Bearer', 'xxxxx.yyyyy.zzzzz']，取索引 1 即为 token
  const token = authHeader.split(' ')[1];

  try {
    // ===== Step 4: JWT 验证 =====
    // jwt.verify(token, secret) 会做两件事:
    //   1) 用 secret 验证签名是否合法（防止 token 被篡改）
    //   2) 检查 token 是否在有效期内（依据 payload 中的 exp 字段）
    // 如果验证通过，返回解码后的 payload 对象（包含用户 ID、用户名等信息）
    // 如果验证失败（签名不匹配/已过期），会抛出异常，进入 catch 分支
    //
    // config.jwt.secret:
    //   - 这是一个只有服务端知道的密钥字符串（存储在 .env 或 config 文件中）
    //   - 一旦泄露，任何人都可以伪造 token，因此必须妥善保管
    //   - 生产环境中建议使用至少 32 位的随机字符串
    const decoded = jwt.verify(token, config.jwt.secret);

    // ===== Step 5: 将用户信息挂载到请求对象 =====
    // req.user 存储解码后的用户信息（如 { id: 1, username: 'admin', role: 'admin' }）
    // 后续路由处理器可以通过 req.user 获取当前登录用户的信息
    // 例如: 创建文章时自动记录作者 req.user.id
    req.user = decoded;

    // 调用 next() 放行，进入下一个中间件或路由处理函数
    next();
  } catch (err) {
    // ===== JWT 验证失败处理 =====
    // 可能的失败原因:
    //   - token 已过期（TokenExpiredError）
    //   - 签名不匹配，token 被篡改（JsonWebTokenError）
    //   - token 格式错误（NotBeforeError 等）
    // 统一返回 401，提示用户重新登录获取新 token
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
};
