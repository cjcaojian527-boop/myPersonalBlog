// ============================================================
// 文件用途：应用全局配置中心
// 集中的配置文件，从环境变量（.env 文件）读取敏感信息，
// 并提供降级默认值，方便开发环境快速启动
// ============================================================

require('dotenv').config();  // 加载 .env 文件中的环境变量到 process.env

module.exports = {
  port: process.env.PORT || 3001,  // 服务监听端口，默认 3001

  // JWT（JSON Web Token）认证配置
  jwt: {
    // JWT 签名密钥，用于生成和验证 Token。生产环境务必使用复杂随机字符串
    secret: process.env.JWT_SECRET || 'personal-blog-jwt-secret-2026',
    // Token 过期时间，7d 表示 7 天后过期。支持格式：'1h', '7d', '30d' 等
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 数据库连接参数
  db: {
    host: process.env.DB_HOST || 'localhost',      // 数据库主机
    port: process.env.DB_PORT || 3306,              // 数据库端口
    database: process.env.DB_NAME || 'personal_blog', // 数据库名称
    username: process.env.DB_USER || 'root',         // 数据库用户名
    password: process.env.DB_PASSWORD || '',          // 数据库密码
    dialect: 'mysql',                                 // 数据库类型（固定为 MySQL）
  },

  // 文件上传限制配置
  upload: {
    maxSize: 5 * 1024 * 1024,   // 上传文件大小上限：5MB（5 * 1024 * 1024 字节）
    // 允许上传的 MIME 类型白名单，只接受这四种图片格式
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // MinIO 对象存储配置
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'personal-blog',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
};
