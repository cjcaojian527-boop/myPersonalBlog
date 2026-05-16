// MinIO 客户端初始化 + 桶自动创建
const Minio = require('minio');
const config = require('./index');

const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
  useSSL: config.minio.useSSL,
});

const bucket = config.minio.bucket;

// 确保 MinIO 桶存在，不存在则创建
async function ensureBucket() {
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket);
    // 设置桶策略为公开读，这样图片可以通过 URL 直接访问
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      }],
    };
    await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    console.log(`MinIO bucket "${bucket}" created with public read policy.`);
  }
}

module.exports = { minioClient, bucket, ensureBucket };