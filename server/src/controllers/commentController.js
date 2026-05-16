// 本文件是评论系统的控制器，负责评论的获取、创建（含验证码校验）和删除
// 支持嵌套评论（楼中楼/线程式回复结构）
const { Comment, User } = require('../models');
const captcha = require('./captchaController'); // 引入验证码控制器，用于评论防灌水

// 获取评论列表（支持按文章 ID 筛选，不传则返回全部评论——管理员场景）
exports.list = async (req, res) => {
  // try-catch 保护评论查询和线程化数据结构构建
  try {
    const { articleId } = req.query; // 可选的文章 ID，用于获取某篇文章下的所有评论
    // 管理员查看所有评论（不限制文章）：直接按时间倒序返回，不使用嵌套结构
    if (!articleId) {
      const all = await Comment.findAll({
        include: [
          { model: User, as: 'user', attributes: ['id', 'username', 'nickname'] },
        ],
        order: [['createdAt', 'DESC']],
      });
      return res.json({ list: all, total: all.length });
    }
    // 前端查看文章评论：按时间正序查询（先发表的在前），并附带回复目标用户信息
    const comments = await Comment.findAll({
      where: { articleId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        // replyToUser 关联表示这条评论回复的目标用户
        { model: User, as: 'replyToUser', attributes: ['id', 'username', 'nickname'] },
      ],
      order: [['createdAt', 'ASC']], // 按时间正序，让对话按时间线自然展开
    });

    // 构建线程式（树形）评论结构：通过 parentId 将子评论挂载到父评论的 children 数组中
    const map = {};
    const roots = [];        // 根评论（没有 parentId 的顶级评论）
    // 第一遍遍历：将所有评论放入 map，并初始化 children 为空数组
    comments.forEach(c => {
      const json = c.toJSON();
      json.children = [];
      map[json.id] = json;
    });
    // 第二遍遍历：根据 parentId 挂载子评论到父评论的 children，无父亲的归为根评论
    comments.forEach(c => {
      const json = map[c.id];
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].children.push(json); // 作为子评论挂载
      } else {
        roots.push(json); // 顶级评论放入根数组
      }
    });

    // 返回树形结构，前端可直接递归渲染嵌套评论
    res.json({ list: roots, total: comments.length });
  } catch (err) {
    res.status(500).json({ message: '获取评论失败', error: err.message });
  }
};

// 创建新评论（需登录 + 验证码校验）
exports.create = async (req, res) => {
  // try-catch 保护评论创建全流程（验证码校验、数据库写入、关联查询）
  try {
    // content       - 评论正文内容（必填）
    // articleId     - 被评论的文章 ID（必填）
    // parentId      - 父评论 ID（可选，用于回复某条评论）
    // replyToUserId - 被回复的用户 ID（可选，用于楼层回复）
    // captchaId     - 验证码 ID（必填，由 /captcha 接口获取）
    // captcha       - 用户输入的验证码文本（必填）
    const { content, articleId, parentId, replyToUserId, captchaId, captcha: captchaText } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: '评论内容不能为空' });
    if (!articleId) return res.status(400).json({ message: '缺少文章ID' });

    // 验证码校验：调用 captchaController.verify 方法验证用户输入
    // 验证失败返回 400，前端提示用户重新输入验证码
    if (!captcha.verify(captchaId, captchaText)) {
      return res.status(400).json({ message: '验证码错误，请重新输入' });
    }

    // 创建评论记录，userId 来自 JWT 认证中间件注入的 req.user
    const comment = await Comment.create({
      content: content.trim(),
      articleId,
      userId: req.user.id,
      parentId: parentId || null,           // 如果没有父评论则存 null（顶级评论）
      replyToUserId: replyToUserId || null,  // 如果没有回复目标则存 null
    });

    // 创建后再查询一次，附带关联的用户信息，返回给前端直接渲染
    const full = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] },
        { model: User, as: 'replyToUser', attributes: ['id', 'username', 'nickname'] },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    // 捕获验证码过期、数据库写入异常等
    res.status(500).json({ message: '评论发表失败，请稍后重试', error: err.message });
  }
};

// 删除评论（管理员权限，用于管理不当评论）
exports.remove = async (req, res) => {
  // try-catch 保护删除操作
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ message: '评论不存在' });
    await comment.destroy();
    res.json({ message: '评论已删除' });
  } catch (err) {
    res.status(500).json({ message: '删除评论失败', error: err.message });
  }
};
