
//导入配置文件
require('dotenv').config();


const DBCONFIG = {
    database: process.env.DB_NAME,//database_name
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
}

const minioCofig = {
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL !== 'false',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucketName: process.env.MINIO_BUCKET,
    region: 'us-east-1',
    pathStyle: true,
    partSize: 10 * 1024 * 1024,  // ← 10MB 以下不分片，3MB 文件直接用单次请求
}
// console.log('minioCofig:', minioCofig);

//默认用户信息
const USERINFO = {
    defaultPassword: process.env.defaultPassword,

}

// 国密 SM2 配置
const sm2Info = {
    privateKey: process.env.SM2_PRIVATE_KEY,
    publicKey:  process.env.SM2_PUBLIC_KEY,   // 留一份，方便以后接口下发
    cipherMode: 1,   // ⭐ C1C3C2 模式（新国标），必须和前端一致！
};


const jwtInfo = {
    secret: process.env.JWT_SECRET,
    T_secret: process.env.JWT_TOURISTS_SECRET,//游客密钥
    expiresIn: process.env.JWT_EXPIRES_IN,//过期时间
    Temp_expiresIn: process.env.JWT_TEMP_EXPIRES_IN,//临时账户过期时间
    tokenName: "Authorization",
    TouriststokenName: "TouristsAuthorization",
}

const routeInfo = {
    baseUri: '/api',
    //请求白名单（写完整路径，匹配时会自动拼上 baseUri）
    routeWhitelist: [
        // '/auth/Register',        // 后台注册：必须登录后才能调用，故意不放行
        // '/auth/queryUsers',      // 用户查询：必须登录后才能调用
        '/auth/Login',
        '/auth/getCaptchaCode',
        '/auth/verifyCode',
        '/menu/getMenus',
        '/artcle/getList',
        '/context/getList',
        '/articleType/getList',
        '/labels/getLabels',
        '/touristsAuth/Login',
        '/touristsAuth/Register',
        '/stats/getSiteStats',
    ],
}


const MIME_TYPE_MAP = {
    // 图片
    jpg: 'image/jpeg',
    // jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    // tiff: 'image/tiff',

    // 视频
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    // mov: 'video/quicktime',
    // avi: 'video/x-msvideo',
    // mkv: 'video/x-matroska',

    // PDF
    pdf: 'application/pdf'
};
const ELEMNTTYPE = {
    "text": 'text',
    "h1": "h1",
    "h2": "h2",
    "h3": "h3",
    "h4": "h4",
    "h5": "h5",
    "h6": "h6",
    // "img": "图片类",
    // "video": "video",
    // "pdf": "pdf",
    "code": "code",
    ...MIME_TYPE_MAP
}
//临时管理不可访问的菜单
const TempRoute = [
    "/admin/MenusCrud",
    "/admin/Users",
    "/admin/touristsUser",
]

const commentStatus = ['approved', 'pending', 'rejected'];

//站点信息（前台展示用）
const siteInfo = {
    startDate: '2026-08-23',   // ← 建站日期，主人请按实际情况修改
}

module.exports = {
    port: process.env.PORT || 3002,
    db: DBCONFIG,
    userinfo: USERINFO,
    routeInfo,
    jwtInfo,
    ELEMNTTYPE,
    commentStatus,
    minioCofig,
    TempRoute,
    siteInfo,
    sm2Info
}