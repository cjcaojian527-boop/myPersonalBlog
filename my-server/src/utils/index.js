// 随机头像源：每个元素是 (seed) => 图片 URL（DiceBear 免费服务，GET 直返图片、无需 API Key）
const AVATAR_SOURCES = [
    (seed) => `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`,   // 卡通小人
    (seed) => `https://api.dicebear.com/9.x/bottts/png?seed=${seed}`,      // 机器人
    (seed) => `https://api.dicebear.com/9.x/identicon/png?seed=${seed}`,   // 几何色块
    (seed) => `https://api.dicebear.com/9.x/pixel-art/png?seed=${seed}`,   // 像素风
    (seed) => `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}`,     // 线条脸
];

// 兜底头像：Node 没有 canvas，改用「SVG 蓝底白字」生成 Buffer
const generateFallbackAvatarBuffer = () => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const text = `游客${randomNum}`;
    const size = 128;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#1677ff"/>
  <text x="${size / 2}" y="${size / 2}" font-size="26" fill="#ffffff"
        text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${text}</text>
</svg>`;
    return Buffer.from(svg, 'utf-8');
};

/**
 * 生成随机头像（Node 版，替代前端的 canvas / File 实现）
 * 返回「multer 风格的 file 对象」，可直接喂给 minioClient.putObject
 * @returns {Promise<{originalname:string, fieldname:string, buffer:Buffer, mimetype:string, size:number}>}
 */
const generateRandomAvatar = async () => {
    const seed = Math.random().toString(36).slice(2, 10);   // 随机种子（决定头像长相）

    try {
        // 随机抽一个头像源
        const source = AVATAR_SOURCES[Math.floor(Math.random() * AVATAR_SOURCES.length)];
        const url = source(seed);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);   // 3 秒超时，避免一直等
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!resp.ok) throw new Error('头像请求失败: ' + resp.status);

        // ★ 关键差异：浏览器用 resp.blob()，Node 用 arrayBuffer() 再转 Buffer
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 按响应头的真实 MIME 推后缀（不同源可能是 png，也可能是 svg）
        const mime = (resp.headers.get('content-type') || 'image/png').split(';')[0].trim();
        const ext = (mime.split('/')[1] || 'png').replace('svg+xml', 'svg');

        return {
            originalname: `${seed}.${ext}`,   // ← 供 path.extname() 取后缀
            fieldname: 'file',              // ← 供拼接 images/file/ 目录
            buffer,                           // ← 供 putObject 上传
            mimetype: mime,                   // ← 供 Content-Type
            size: buffer.length,
        };
    } catch (e) {
        // 网络失败 → 用 SVG 兜底（对应前端的 canvas 兜底）
        const buffer = generateFallbackAvatarBuffer();
        return {
            originalname: `${seed}.svg`,
            fieldname: 'file',
            buffer,
            mimetype: 'image/svg+xml',
            size: buffer.length,
        };
    }
};


// ===== 最后统一导出 =====
module.exports = {
    AVATAR_SOURCES,
    generateFallbackAvatarBuffer,
    generateRandomAvatar,
};