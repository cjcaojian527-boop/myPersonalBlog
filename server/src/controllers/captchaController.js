// 本文件是验证码的控制器，负责生成 SVG 图形验证码和验证用户输入
const svgCaptcha = require('svg-captcha'); // svg-captcha：生成基于 SVG 的图形验证码，无需 canvas 依赖

// 内存中的验证码存储（Map 结构，key 为 captchaId，value 为验证码文本）
// 注意：使用内存存储不适合多进程部署，正式环境应改用 Redis
const captchaStore = new Map();

// 生成验证码（返回 SVG 图片数据和验证码 ID）
exports.generate = (req, res) => {
  // create 方法生成验证码对象，包含 data（SVG 字符串）和 text（正确文本）
  const captcha = svgCaptcha.create({
    size: 4,                     // 验证码长度：4位字符
    ignoreChars: '0o1il',        // 排除易混淆字符（0和o, 1、i、l 等）
    noise: 3,                    // 干扰线条数量，增加识别难度防止 OCR 破解
    color: true,                 // 启用彩色字符
    background: '#f0f0f0',       // 浅灰色背景
  });
  // 生成唯一验证码 ID：时间戳的 36 进制 + 随机字符串，防止碰撞
  const captchaId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  // 将验证码文本转为小写存储，验证时不区分大小写
  captchaStore.set(captchaId, captcha.text.toLowerCase());
  // 5分钟后自动清除过期验证码，防止内存泄漏
  setTimeout(() => captchaStore.delete(captchaId), 5 * 60 * 1000);
  // 返回验证码 ID（前端携带此 ID 提交验证）和 SVG 图片数据（前端直接渲染）
  res.json({ captchaId, svg: captcha.data });
};

// 验证用户输入的验证码
// captchaId - 由 generate 返回的验证码唯一标识
// text      - 用户输入的验证码文本
// 返回 true 表示验证通过（验证码匹配），false 表示失败或已过期
exports.verify = (captchaId, text) => {
  if (!captchaId || !text) return false;    // 参数缺失直接拒绝
  const stored = captchaStore.get(captchaId);
  if (!stored) return false;                // 验证码不存在或已过期
  captchaStore.delete(captchaId);           // 验证码一次性使用，验证后立即删除防止重复提交
  return stored === text.toLowerCase();      // 不区分大小写比对
};
