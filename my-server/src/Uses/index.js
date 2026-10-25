const { routeInfo, jwtInfo, sm2Info } = require('../config');
const { sm2 } = require('sm-crypto');
// const _path = require('path');
const jwt = require('jsonwebtoken');
const menusData = require('../seeds/menus');   // 老大钦定的种子菜单 = 内置菜单的唯一权威
const Menu = require('../models/Menu');


// 比如只有超级管理员才能访问的接口
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ code: -1, message: '非超级管理员，权限不足！' });
    }
    next();
};

// 管理员及以上（管理员 + 超级管理员）
const requireAdmin = (req, res, next) => {
    // console.log('req.user:', req.user);
    // console.log('req.Tourists_user:', req.Tourists_user);
    if (req.Tourists_user) {
        //游客放行
        return next();
    }
    if (!['super_admin', 'admin'].includes(req.user?.role)) {
        return res.status(403).json({ code: -1, message: '非管理员，权限不足！' });
    }
    next();
};

const requireFile = (req, res, next) => {
    if (req.file?.originalname) {
        console.log('操作文件：', req.file.originalname);
    }
    if (!req.user) {
        return res.json({ code: -1, message: '权限不足，操作失败！' });
    }
    next();
};
// 处理临时用户
const requireTempUser = (req, res, next) => {

    if (req.Tourists_user) {
        //游客放行
        return next();
    }
    if (req.user?.role && req.user?.role === 'temp_admin') {
        let { userId } = req.body;
        if (req.user?.id !== userId) {
            //操作的对象不是自己的话
            return res.json({ code: -1, message: '权限不足，操作失败！' });
        }
    }
    next();
};

// SM2 密文特征：128 位以上的十六进制字符串
// （C1 占 64 字节 + C3 占 32 字节 = 96 字节 = 192 位十六进制，再加明文长度）
const isSM2Cipher = (s) => typeof s === 'string' && /^[0-9a-f]{128,}$/i.test(s);

// ==================== SM2 防重放 ====================
// 密文的加密强度再高，攻击者也能「解不开但照抄」—— 把截获的密文原样重发一次。
// 所以前端每次请求都要带两样东西：
//   ① timestamp：请求发起的时间戳 → 防「几天前截获的密文，今天拿出来重发」
//   ② nonce    ：一次性随机数       → 防「有效期内把同一个密文重复发」
const SM2_MAX_AGE = 60 * 1000;    // 时间窗口：60 秒
const SM2_MAX_SKEW = 60 * 1000;   // 容忍客户端时钟「快」60 秒

// 存「用过的 nonce」：Map<nonce, 过期时间戳>
// 用 Map 而不是 Set，是因为要记下每条的过期时间，方便定期清理
global.sm2NonceStore = global.sm2NonceStore || new Map();

// 定期清理过期的 nonce，防止 Map 无限增长（内存泄漏）
// 清理间隔就取时间窗口本身，过期残留最多只留一个周期 ✅
const nonceTimer = setInterval(() => {
    const now = Date.now();
    for (const [nonce, expireAt] of global.sm2NonceStore) {
        if (now > expireAt) global.sm2NonceStore.delete(nonce);
    }
}, SM2_MAX_AGE);
nonceTimer.unref();   // 不阻止 Node 进程退出

/**
 * SM2 密码解密中间件（含防重放）
 * 挂在需要接收密码的接口上，解密后把明文写回 req.body.password
 * controller 拿到的依然是明文，业务代码零改动 ✅
 */
const decryptSM2 = (req, res, next) => {
    const { password, timestamp, nonce } = req.body ?? {};
    if (!password) return next();

    // 不是密文 → 当明文放行（兼容还没升级的老版本前端）
    // ⚠️ 明文路径不校验时间戳/nonce：攻击者能看到明文的话，压根不需要重放
    if (!isSM2Cipher(password)) return next();

    // ── 密文路径：必须过防重放两关 ──

    // 参数齐全性检查
    if (!timestamp || !nonce) {
        return res.json({ code: -1, message: '请求参数缺失，请刷新页面后重试' });
    }
    // 防攻击者塞个超长字符串把内存撑爆
    if (typeof nonce !== 'string' || nonce.length > 64) {
        return res.json({ code: -1, message: '请求参数非法' });
    }

    // ── 第 1 关：时间戳 ──
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
        return res.json({ code: -1, message: '请求参数非法' });
    }
    const age = Date.now() - ts;
    // age 太大  → 老密文，过期（防「存起来以后再发」）
    // age 为负  → 时间戳来自未来，可疑（防「传个 2099 年，让校验永远通过」）
    if (age > SM2_MAX_AGE || age < -SM2_MAX_SKEW) {
        return res.json({ code: -1, message: '请求已过期，请刷新页面后重试' });
    }

    // ── 第 2 关：nonce 不能重复使用 ──
    if (global.sm2NonceStore.has(nonce)) {
        return res.json({ code: -1, message: '请勿重复提交，请刷新页面后重试' });
    }

    // ── 两关全过，开始解密 ──
    try {
        const plain = sm2.doDecrypt(password, sm2Info.privateKey, sm2Info.cipherMode);
        if (!plain) throw new Error('解密结果为空');

        // ⭐ 解密成功后才登记 nonce：
        //    万一解密失败（网络截断等），nonce 不消耗，用户可以重试 ✅
        global.sm2NonceStore.set(nonce, Date.now() + SM2_MAX_AGE);

        req.body.password = plain;
        next();
    } catch (e) {
        console.error('SM2 解密失败:', e.message);
        res.json({ code: -1, message: '密码解密失败，请刷新页面后重试' });
    }
};


// ==================== 系统内置菜单保护 ====================
// 【严格匹配】判定「这条是不是内置菜单」时，除了 id，这些业务字段必须逐一比对
// 只看 id 太草率：万一自增 id 撞上内置菜单的 id，正常菜单就被误伤了
const SEED_MATCH_KEYS = ['pid', 'label', 'icon', 'path', 'absolutePath', 'componentPath', 'level', 'display'];

/**
 * 内置菜单保护闸门：拦截对种子菜单的「修改」和「删除」
 * 用法：router.post('/updateMenu', requireAdmin, protectSeedMenu, updateMenu)
 */
const protectSeedMenu = async (req, res, next) => {
    const { id } = req.body;

    if (id === undefined || id === null || id === '') {
        return res.json({ code: -1, message: '缺失参数' });
    }

    // ── 第 1 关：id 在种子文件里能不能找到 ──
    const seed = menusData.find(m => m.id === Number(id));
    if (!seed) {
        return next();   // 不是内置菜单的 id → 放行
    }

    try {
        // ── 第 2 关：把库里这条抓出来，逐字段与种子比对 ──
        const instance = await Menu.findByPk(id);
        if (!instance) {
            return res.json({ code: -1, message: '菜单不存在' });
        }

        const current = instance.get({ plain: true });   // 转普通对象，比较更干净

        // 全部转成字符串再比，规避 number / string / boolean 的类型差异
        const isSeed = SEED_MATCH_KEYS.every(k => String(current[k]) === String(seed[k]));

        if (isSeed) {
            // ⛔ 两关全中 → 确认是内置菜单，谁都不许动
            //    （老大若想给超管开个后门，在下面这行前面加：
            // if (req.user?.role === 'super_admin') return next();
            return res.json({ code: -1, message: '系统内置菜单，禁止修改或删除！' });
        }

        // id 是内置的，但字段对不上（历史遗留 / 手工改过库）→ 放行
        next();

    } catch (error) {
        console.error('内置菜单保护校验失败:', error.message);
        res.status(500).json({ code: -1, message: '校验失败: ' + error.message });
    }
};


// 站点访问统计（数据存内存，服务重启会归零）
const statsMiddleware = (req, res, next) => {
    // 兜底初始化，防止还没初始化就被访问
    if (!global.siteStats) {
        global.siteStats = {
            totalVisits: 0,       // 访问总数
            totalVisitors: 0,     // 总访客数
            visitorIps: new Set() // 访客 IP 集合，用于去重
        };
    }

    const stats = global.siteStats;

    // 访问总数 +1
    stats.totalVisits++;

    // 访客去重：同一个 IP 只统计一次
    let ip = req.ip || '';
    ip = ip.replace(/^::ffff:/, '');   // 去掉 IPv4 映射前缀
    if (ip && !stats.visitorIps.has(ip)) {
        stats.visitorIps.add(ip);
        stats.totalVisitors++;
    }

    next();
};


// Uses/index.js
const verifyCaptcha = (req, res, next) => {
    const { code, captchaId } = req.body;
    if (req.user?.role) {
        //是后台用户
        return next();
    }
    if (code === undefined || captchaId === undefined) {
        return res.json({ code: -1, message: '验证码参数缺失' });  // 中断
    }

    // 开发环境跳过
    // if (process.env.NODE_ENV !== 'production') {
    //     if (global.captchaStore?.[captchaId]) delete global.captchaStore[captchaId];
    //     return next();   // 放行
    // }


    const captchaStore = global.captchaStore?.[captchaId];
    if (!captchaStore) {
        return res.json({ code: -1, message: '验证码不存在' });    // 中断
    }
    if (Date.now() > captchaStore.expires) {
        delete global.captchaStore[captchaId];
        return res.json({ code: -1, message: '验证码过期' });      // 中断
    }
    if (captchaStore.code.toLowerCase() !== code.toLowerCase()) {
        return res.json({ code: -1, message: '验证码错误' });      // 中断
    }

    delete global.captchaStore[captchaId];
    next();   // 全部通过 → 放行
};




// ==================== IP 限流（内存版，服务重启会重置） ====================
/**
 * 创建限流中间件（滑动窗口算法）
 * @param {number} windowMs 时间窗口（毫秒）
 * @param {number} limit    时间窗口内最多允许的次数
 * @param {string} name     限流器名字，不同名字用独立计数，互不干扰
 */
const createRateLimiter = ({ windowMs = 60 * 60 * 1000, limit = 3, name = 'default' } = {}) => {
    // 每个限流器独立的内存存储：Map<IP, 时间戳数组>
    global.rateLimitStore = global.rateLimitStore || {};
    const store = global.rateLimitStore[name] = global.rateLimitStore[name] || new Map();

    // 定期清理「记录已全部过期」的 IP，防止 Map 无限增长（内存泄漏）
    const timer = setInterval(() => {
        const now = Date.now();
        for (const [ip, records] of store) {
            const valid = records.filter(t => now - t < windowMs);
            if (valid.length === 0) store.delete(ip);   // 这个 IP 的记录全过期了，删掉
            else store.set(ip, valid);
        }
    }, 10 * 60 * 1000);
    timer.unref();   // 不阻止 Node 进程退出

    return (req, res, next) => {
        if (req.user?.role) {
            //是后台用户
            return next();
        }
        const ip = (req.ip || '').replace(/^::ffff:/, '');
        const now = Date.now();

        // 只保留还在时间窗口内的记录
        const records = (store.get(ip) || []).filter(t => now - t < windowMs);

        if (records.length >= limit) {
            // 最早的那条记录过期后就能再试，算出还要等几分钟
            const waitMin = Math.max(1, Math.ceil((windowMs - (now - records[0])) / 60000));
            return res.status(429).json({    // 429 = Too Many Requests（HTTP 标准状态码）
                code: -1,
                message: `操作过于频繁，请 ${waitMin} 分钟后再试`
            });
        }

        records.push(now);
        store.set(ip, records);
        next();
    };
};

// 游客注册限流：同一个 IP，1 小时内最多注册 3 次
const registerLimiter = createRateLimiter({ name: 'touristsRegister', windowMs: 60 * 60 * 1000, limit: 3 });


// ==================== 全局错误兜底（放在所有路由之后） ====================
const ErrorFN = (err, req, res, next) => {
    // ① 日志留全：服务端自己看的，越详细越好（但绝不能对外）
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} 出错：`);
    console.error(err.stack || err);

    // ② 响应头已经发出去了 → 说明前面已经回过客户端了
    //    这时再回一次会报 "Cannot set headers after they are sent to the client"
    //    交还给 Express 内置处理器，由它负责断开连接
    if (res.headersSent) {
        return next(err);
    }

    // ③ 优先用错误对象自带的状态码（比如 body-parser 解析失败是 400）
    const status = err.status || err.statusCode || 500;

    // ④ ⭐ 只有开发环境才把堆栈给客户端
    //    生产环境吐堆栈 = 泄露文件路径和目录结构，属典型信息泄露
    const isDev = false;//process.env.NODE_ENV !== 'production';

    res.status(status).json({
        code: -1,
        message: isDev
            ? (err.message || '服务器内部错误')
            : '服务器内部错误，请稍后再试',
        // 生产环境连这个字段都不会存在
        ...(isDev && err.stack ? { stack: err.stack } : {}),
    });
}

//全局令牌验证
const authMiddleware = (req, res, next) => {
    const token = req.headers[jwtInfo.tokenName.toLocaleLowerCase()];
    // console.log(req.url, req.headers);
    // 白名单匹配：拼上 baseUri 做「精确匹配」
    // （原来用 includes 是漏洞：URL 里带个 ?x=Login 就能绕过鉴权）
    if (routeInfo.routeWhitelist.some(s => req.path === routeInfo.baseUri + s)) {
        //白名单
        if (token && token.startsWith('Bearer ')) {
            const cleanToken = token.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(cleanToken, jwtInfo.secret);
                req.user = decoded;//挂载起来后面用
                return next();

            } catch (error) {
                return next();
            }
        }
        return next();
    } else {

        // console.log(token);
        if (!token || !token.startsWith('Bearer ')) {
            const Tourists_token = req.headers[jwtInfo.TouriststokenName.toLocaleLowerCase()];

            //对游客类部分接口放行  游客登录了才能改信息

            if (!Tourists_token || !Tourists_token.startsWith('Bearer ')) {
                return res.status(401).json({ code: -1, message: '未提供 token，请先登录！' });
            }
            const cleanToken = Tourists_token.replace('Bearer ', '');

            try {
                const decoded = jwt.verify(cleanToken, jwtInfo.T_secret);
                req.Tourists_user = decoded;//挂载起来后面用
                return next();

            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        code: 401,
                        message: '游客 token 已过期，请重新登录'
                    });
                }
                return res.status(401).json({
                    code: 401,
                    message: '无效的 token'
                });
            }
        }

        const cleanToken = token.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(cleanToken, jwtInfo.secret);
            req.user = decoded;//挂载起来后面用
            return next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    code: 401,
                    message: 'token 已过期，请重新登录'
                });
            }
            return res.status(401).json({
                code: 401,
                message: '无效的 token'
            });
        }

    }

}


module.exports = {
    requireSuperAdmin,
    requireAdmin,
    ErrorFN,
    requireTempUser,
    requireFile,
    authMiddleware,
    statsMiddleware,
    verifyCaptcha,
    createRateLimiter,
    registerLimiter,
    protectSeedMenu,
    decryptSM2
};
