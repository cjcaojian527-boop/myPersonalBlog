
const Minio = require('minio');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');
// console.log('MINIO_OBJ:',MINIO_OBJ);
const minioClient = new Minio.Client(MINIO_OBJ);

async function testConnection(callback) {

    try {
        // 尝试检查存储桶是否存在
        const exists = await minioClient.bucketExists(bucketName);
        if (exists) {
            console.log(`Minio 连接成功！存储桶 "${bucketName}" 存在。`);
            callback && callback();
        } else {
            console.log(`Minio 连接成功，但存储桶 "${bucketName}" 不存在。`);
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`存储桶 "${bucketName}" 再次创建成功！。`);
             callback && callback();
        }
    } catch (error) {
        console.error('Minio 连接失败:', error.message);
    }
}

// testConnection();


/**
 * 清理 MinIO 中没有被数据库引用的孤儿文件
 * 只找「MinIO 有但数据库没有」的文件并删除
 * 数据库有但 MinIO 没有的不管
 */
async function cleanOrphanFiles() {
    const ArticleList = require('../models/ArticleList');
    const User = require('../models/User');
    const Tourists = require('../models/touristsUser');
    const Context = require('../models/context');

    // ========== 第 1 步：拿到 MinIO 里所有文件 ==========
    const minioFiles = [];
    const stream = minioClient.listObjects(bucketName, '', true);
    for await (const obj of stream) {
        minioFiles.push(obj.name);  // 比如 "images/content/1786097896512-4112.jpg"
    }
    console.log(`MinIO 中共 ${minioFiles.length} 个文件`);

    // ========== 第 2 步：从数据库提取所有被引用的文件路径 ==========
    const referencedFiles = new Set();

    // 从完整 URL 中提取 MinIO 对象路径
    // 输入: "/blog-storage/images/content/xxx.jpg" 或 "http://xxx/blog-storage/images/content/xxx.jpg"
    // 输出: "images/content/xxx.jpg"
    const extractPath = (url) => {
        if (!url || typeof url !== 'string') return null;
        // 匹配 /{bucketName}/ 后面的部分
        const match = url.match(new RegExp(`/${bucketName}/(.+)$`));
        return match ? match[1] : null;
    };

    // 2.1 文章封面图
    const articles = await ArticleList.findAll({ attributes: ['coverImage'] });
    articles.forEach(a => {
        const path = extractPath(a.coverImage);
        if (path) referencedFiles.add(path);
    });

    // 2.2 用户头像
    const users = await User.findAll({ attributes: ['avatar'] });
    users.forEach(u => {
        const path = extractPath(u.avatar);
        if (path) referencedFiles.add(path);
    });

    // 2.3 游客头像
    const tourists = await Tourists.findAll({ attributes: ['avatar'] });
    tourists.forEach(t => {
        const path = extractPath(t.avatar);
        if (path) referencedFiles.add(path);
    });

    // 2.4 文章正文（HTML 里可能嵌有图片链接）
    const contexts = await Context.findAll({ attributes: ['content'] });
    contexts.forEach(c => {
        if (!c.content) return;
        // 匹配所有 /blog-storage/... 的路径
        const regex = new RegExp(`/${bucketName}/([\\w\\-/.]+\\.\\w+)`, 'g');
        let match;
        while ((match = regex.exec(c.content)) !== null) {
            referencedFiles.add(match[1]);
        }
    });

    console.log(`数据库引用了 ${referencedFiles.size} 个文件`);

    // ========== 第 3 步：找出孤儿文件并删除 ==========
    let deletedCount = 0;
    const orphanFiles = [];

    for (const fileName of minioFiles) {
        if (!referencedFiles.has(fileName)) {
            orphanFiles.push(fileName);
        }
    }

    console.log(`发现 ${orphanFiles.length} 个孤儿文件`);

    for (const fileName of orphanFiles) {
        try {
            await minioClient.removeObject(bucketName, fileName);
            console.log(`  ✅ 已删除: ${fileName}`);
            deletedCount++;
        } catch (error) {
            console.error(`  ❌ 删除失败: ${fileName}`, error.message);
        }
    }

    console.log(`清理完成，共删除 ${deletedCount} 个文件`);
    return { total: minioFiles.length, referenced: referencedFiles.size, orphan: orphanFiles.length, deleted: deletedCount };
}

module.exports = { minioClient, testConnection, cleanOrphanFiles };

