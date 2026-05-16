/**
 * 文件上传中间件 —— 使用 multer 内存存储 + MinIO 对象存储
 *
 * 流程: 前端上传文件 → multer 缓存到内存 → 路由层上传到 MinIO → 返回 MinIO URL
 * multer 只做临时缓冲和类型/大小校验，不再写入磁盘
 */
const multer = require('multer');
const config = require('../config');

// 使用内存存储，文件不落盘，直接存在 req.file.buffer 中
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持 JPG/PNG/GIF/WebP'), false);
    }
  },
  limits: { fileSize: config.upload.maxSize },
});

module.exports = upload;