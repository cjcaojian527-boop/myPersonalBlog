// 文件上传路由 —— 上传到 MinIO 对象存储，返回可访问的 URL
const router = require('express').Router();
const path = require('path');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { minioClient, bucket } = require('../config/minio');

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请选择文件' });

    // 生成唯一文件名：时间戳-随机数.扩展名
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // 上传到 MinIO
    await minioClient.putObject(bucket, filename, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    });

    // 构造可访问的 URL
    const { endPoint, port, useSSL } = require('../config').minio;
    const protocol = useSSL ? 'https' : 'http';
    const url = `${protocol}://${endPoint}:${port}/${bucket}/${filename}`;

    res.json({ url, filename });
  } catch (err) {
    res.status(500).json({ message: '上传失败', error: err.message });
  }
});

module.exports = router;