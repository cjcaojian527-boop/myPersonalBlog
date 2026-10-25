import React, { useState, useEffect, useRef } from 'react';
import { getRequest } from '@utils/api';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import rTime from 'dayjs/plugin/relativeTime';
dayjs.locale('zh-cn');
dayjs.extend(rTime);

let navigateInstance = null;
// 背景状态枚举
export const BG_STATES = {
    SUNNY_MORNING: 'sunny_morning',     // 晴天上午
    SUNNY_AFTERNOON: 'sunny_afternoon', // 晴天下午
    SUNNY_EVENING: 'sunny_evening',     // 晴天傍晚
    SUNNY_NIGHT: 'sunny_night',         // 晴天夜晚
    CLOUDY: 'cloudy',                   // 阴天
    RAINY: 'rainy',                     // 雨天
};

// 背景样式映射
export const BG_STYLES = {
    [BG_STATES.SUNNY_MORNING]: 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 50%, #E0F6FF 100%)',
    [BG_STATES.SUNNY_AFTERNOON]: 'linear-gradient(180deg, #F4A460 0%, #FFD700 50%, #FFF8DC 100%)',
    [BG_STATES.SUNNY_EVENING]: 'linear-gradient(180deg, #FF6347 0%, #FF4500 50%, #FFD700 100%)',
    [BG_STATES.SUNNY_NIGHT]: 'linear-gradient(180deg, #0C1445 0%, #1a237e 50%, #283593 100%)',
    [BG_STATES.CLOUDY]: 'linear-gradient(180deg, #708090 0%, #B0C4DE 50%, #DCDCDC 100%)',
    [BG_STATES.RAINY]: 'linear-gradient(180deg, #2F4F4F 0%, #4682B4 50%, #708090 100%)',
};

// 根据天气和时间获取背景
export const getBackgroundByWeather = (weatherCode, hour) => {
    // 雨天
    if (weatherCode === '176' || weatherCode === '263' || weatherCode === '296') {
        return BG_STYLES[BG_STATES.RAINY];
    }
    // 阴天
    if (weatherCode === '119' || weatherCode === '122') {
        return BG_STYLES[BG_STATES.CLOUDY];
    }
    // 晴天 - 根据时间
    if (hour >= 6 && hour < 12) {
        return BG_STYLES[BG_STATES.SUNNY_MORNING];
    } else if (hour >= 12 && hour < 18) {
        return BG_STYLES[BG_STATES.SUNNY_AFTERNOON];
    } else if (hour >= 18 && hour < 20) {
        return BG_STYLES[BG_STATES.SUNNY_EVENING];
    } else {
        return BG_STYLES[BG_STATES.SUNNY_NIGHT];
    }
};

export function useLazyLoad(rootId = 'scrollable-container') {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const root = document.getElementById(rootId);

        let observer = null;
        const timer = setTimeout(() => {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        // console.log('显示：',el);
                        setVisible(true);
                        observer.disconnect();
                    }
                },
                { root, rootMargin: '10px 0px' }
            );
            observer.observe(el);
        }, 1000);   // 给 Masonry 布局留时间

        return () => {
            clearTimeout(timer);      // 必须清，否则卸载后还会执行
            observer?.disconnect();
        };
    }, [rootId]);
    return [ref, visible];
}

// 获取所有背景状态列表（用于点击切换）
export const getAllBgStates = () => Object.values(BG_STATES);


// 生成随机邮箱字符串（用于游客占位 / 测试数据）
export const generateRandomEmail = () => {
    const name = Math.random().toString(36).slice(2, 10);   // 随机 8 位字母数字
    const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}@${domain}`;
};

// 兜底头像：canvas 画蓝底白字（“游客 + 随机数字”），返回 data URI
const generateFallbackAvatarDataUri = () => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const text = `游客${randomNum}`;
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#357df0';     // 蓝底（项目主题蓝）
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';     // 白字
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);
    return canvas.toDataURL('image/png');
};

// data URI（base64）转 File 对象
const dataUriToFile = (dataUri, name) => {
    const [meta, base64] = dataUri.split(',');
    const mime = meta.match(/:(.*?);/)[1];
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], name, { type: mime });
};

// 随机头像源：每个元素是 (seed) => 完整图片 URL，均为「GET 直返图片、无需 API Key」的免费服务
const AVATAR_SOURCES = [
    // —— DiceBear（同一服务几十种风格，视觉差异大，当多个源用）——
    (seed) => `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`,   // 卡通小人
    (seed) => `https://api.dicebear.com/9.x/bottts/png?seed=${seed}`,     // 机器人
    (seed) => `https://api.dicebear.com/9.x/identicon/png?seed=${seed}`,  // 几何色块
    (seed) => `https://api.dicebear.com/9.x/pixel-art/png?seed=${seed}`,  // 像素风
    (seed) => `https://api.dicebear.com/9.x/lorelei/png?seed=${seed}`,    // 线条脸
    (seed) => `https://api.dicebear.com/9.x/thumbs/png?seed=${seed}`,     // 拇指小人
    // —— 独立站点 ——
    (seed) => `https://robohash.org/${seed}.png`,                         // RoboHash 机器人
    // (seed) => `https://api.multiavatar.com/${seed}.png`,                  // Multiavatar 多彩头像
    (seed) => `https://ui-avatars.com/api/?name=${seed}&size=128&background=random&color=fff`, // UI Avatars 首字母
];

// 生成随机头像：随机抽取一个头像源请求，请求失败用 canvas 蓝底白字兜底
// 返回 antd Upload 的 fileList 格式（[{ uid, name, status: 'done', url }]），可直接预览
export const generateRandomAvatar = async () => {
    const seed = Math.random().toString(36).slice(2, 10);   // 随机种子（决定头像长相）
    // 随机抽一个头像源
    const source = AVATAR_SOURCES[Math.floor(Math.random() * AVATAR_SOURCES.length)];
    const url = source(seed);
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);   // 3 秒超时，避免一直等
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!resp.ok) throw new Error('头像请求失败');
        const blob = await resp.blob();
        // 按真实 MIME 拼文件名后缀（png / svg 不同源会不一样）
        const ext = (blob.type || 'image/png').split('/')[1] || 'png';
        const name = `${seed}.${ext}`;
        const localUrl = URL.createObjectURL(blob);                  // 转本地预览 URL（blob:）
        const file = new File([blob], name, { type: blob.type || 'image/png' });  // 生成 File，供后续上传
        return [{ uid: seed, name, status: 'done', url: localUrl, originFileObj: file }];
    } catch (e) {
        // console.warn('随机头像请求失败，使用 canvas 兜底头像：', e);
        const name = `${seed}.png`;                                  // canvas 兜底固定 png
        const dataUri = generateFallbackAvatarDataUri();
        const file = dataUriToFile(dataUri, name);                                    // 生成 File，供后续上传
        return [{ uid: seed, name, status: 'done', url: dataUri, originFileObj: file }];
    }
};



export const initMenus = async () => {
    const resp = await getRequest('/api/menu/getMenus?_t=' + Date.now());
    if (resp.code == 0 && resp.data) {
        return deepClone(resp.data);
    } else return [];
}


export const setupNavigate = (navigate) => {
    navigateInstance = navigate;
};

export const navigateTo = (path, options = {}) => {
    if (navigateInstance) {
        navigateInstance(path, options);
    } else {
        window.location.href = path;
    }
};
export const buildDefaultFileList = (url) => {
    if (!url) return [];

    const name = url.split('/').pop();  // "1785661954272-8527.mp4"
    const uid = url.split('/').pop().split('.')[0]; // "1785661954272-8527"

    return [{
        uid,
        name,
        status: 'done',
        url,
    }];
};


// 复制文本到剪贴板，返回是否成功（带老浏览器 / http 非安全上下文降级）
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) { /* 继续走降级 */ }
    // 降级：document.execCommand('copy')（已废弃但兼容老浏览器 / http）
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
};

export function parseUA(ua) {
    const result = {
        browser: '未知',
        browserVersion: '',
        os: '未知',
        osVersion: '',
        engine: '未知',
        device: '未知',
        isMobile: false,
    };

    // 设备类型
    if (/mobile/i.test(ua)) {
        result.device = '手机';
        result.isMobile = true;
    } else if (/tablet|ipad/i.test(ua)) {
        result.device = '平板';
        result.isMobile = true;
    } else {
        result.device = '桌面端';
    }

    // 操作系统（优先级从高到低）
    if (/Windows NT 10\.0/i.test(ua)) {
        result.os = 'Windows 10/11';
    } else if (/Windows NT 6\.3/i.test(ua)) {
        result.os = 'Windows 8.1';
    } else if (/Windows NT 6\.1/i.test(ua)) {
        result.os = 'Windows 7';
    } else if (/Windows/i.test(ua)) {
        result.os = 'Windows';
    } else if (/iPhone OS (\d+_\d+)/i.test(ua)) {
        result.os = 'iOS';
        result.osVersion = ua.match(/iPhone OS (\d+_\d+)/i)[1].replace('_', '.');
    } else if (/iPad.*OS (\d+_\d+)/i.test(ua)) {
        result.os = 'iPadOS';
        result.osVersion = ua.match(/OS (\d+_\d+)/i)[1].replace('_', '.');
    } else if (/Android (\d+[\.\d]*)/i.test(ua)) {
        result.os = 'Android';
        result.osVersion = ua.match(/Android (\d+[\.\d]*)/i)[1];
    } else if (/Mac OS X (\d+_\d+)/i.test(ua)) {
        result.os = 'macOS';
        result.osVersion = ua.match(/Mac OS X (\d+_\d+)/i)[1].replace('_', '.');
    } else if (/Linux/i.test(ua)) {
        result.os = 'Linux';
    }

    // 浏览器（注意顺序：Edge 必须在 Chrome 前面判断）
    if (/Edg\/([\d.]+)/i.test(ua)) {
        result.browser = 'Microsoft Edge';
        result.browserVersion = ua.match(/Edg\/([\d.]+)/i)[1];
    } else if (/OPR\/([\d.]+)/i.test(ua)) {
        result.browser = 'Opera';
        result.browserVersion = ua.match(/OPR\/([\d.]+)/i)[1];
    } else if (/Firefox\/([\d.]+)/i.test(ua)) {
        result.browser = 'Firefox';
        result.browserVersion = ua.match(/Firefox\/([\d.]+)/i)[1];
    } else if (/Chrome\/([\d.]+)/i.test(ua)) {
        result.browser = 'Chrome';
        result.browserVersion = ua.match(/Chrome\/([\d.]+)/i)[1];
    } else if (/Version\/([\d.]+).*Safari/i.test(ua)) {
        result.browser = 'Safari';
        result.browserVersion = ua.match(/Version\/([\d.]+)/i)[1];
    } else if (/Trident.*rv:([\d.]+)/i.test(ua)) {
        result.browser = 'IE';
        result.browserVersion = ua.match(/rv:([\d.]+)/i)[1];
    }

    // 渲染引擎
    if (/AppleWebKit/i.test(ua)) {
        result.engine = 'Blink'; // Chromium 内核的 Edge/Chrome 都走这个
    } else if (/Gecko/i.test(ua)) {
        result.engine = 'Gecko';
    } else if (/Trident/i.test(ua)) {
        result.engine = 'Trident';
    }

    return result;
}


export function deepClone(value, cache = new WeakMap()) {
    // 处理原始类型和函数
    if (typeof value !== 'object' || value === null) return value;

    // 处理循环引用
    if (cache.has(value)) return cache.get(value);

    let result;

    // 处理特殊对象
    if (value instanceof Date) {
        result = new Date(value);
    } else if (value instanceof RegExp) {
        result = new RegExp(value);
    } else if (value instanceof Map) {
        result = new Map();
        cache.set(value, result);
        value.forEach((v, k) => {
            result.set(deepClone(k, cache), deepClone(v, cache));
        });
    } else if (value instanceof Set) {
        result = new Set();
        cache.set(value, result);
        value.forEach(v => result.add(deepClone(v, cache)));
    } else if (Array.isArray(value)) {
        result = [];
        cache.set(value, result);
        value.forEach((item, index) => {
            result[index] = deepClone(item, cache);
        });
    } else {
        result = {};
        cache.set(value, result);
        Object.keys(value).forEach(key => {
            result[key] = deepClone(value[key], cache);
        });
    }

    return result;
}
export const getCommentTrees = (Pnodes = [], Cnodes = [], TouristsAuth = {}) => {
    if (Pnodes.length == 0) return [];

    // 1. 初始化楼层的 children，建所有节点的 id 索引
    const nodeMap = new Map();
    Pnodes.forEach(f => { f.children = []; nodeMap.set(f.id, f); });
    Cnodes.forEach(c => nodeMap.set(c.id, c));

    // 2. 向上追溯，找到任意评论所属的楼层 id
    const getFloorId = (comment) => {
        let current = comment;
        while (current.Commentobject !== -1) {
            current = nodeMap.get(current.Commentobject);
            if (!current) return null;
        }
        return current.id;
    };

    // 3. 所有回复平铺挂到对应楼层的 children
    Cnodes.forEach(c => {
        const floorId = getFloorId(c);
        if (floorId !== null && nodeMap.has(floorId)) {
            nodeMap.get(floorId).children.push(c);
        }
    });

    // 4. 统计每条子评论被回复的次数
    Cnodes.forEach(c => {
        const target = nodeMap.get(c.Commentobject);
        if (target) {
            target.replyCount = (target.replyCount || 0) + 1;
        }
    });

    // 5. 楼层和回复都按时间倒序（新→旧）
    Pnodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 6. 处理评论状态显示和隐藏逻辑
     let commentCount = 0;
    const processCommentStatus = (comment) => {
        if (comment.tId !== undefined && TouristsAuth.navigator) {
            if (comment.tId === TouristsAuth.id) {
                // 自己的评论：设置状态显示文本
                if (comment.CommentStatus === "pending") {
                    comment.CommentStatus_display = '审核中';
                } else if (comment.CommentStatus === "rejected") {
                    comment.CommentStatus_display = '驳回';
                }
                commentCount++;
            } else {
                // 他人的评论：隐藏未审核通过的评论
                if (comment.CommentStatus === "pending" || comment.CommentStatus === "rejected") {
                    comment.hide = true;
                }else{
                    commentCount++;
                }
            }
        }
        // 递归处理子评论
        if (comment.children && comment.children.length > 0) {
            comment.children.forEach(processCommentStatus);
        }
    };

    Pnodes.forEach(f => {
        processCommentStatus(f);
        f.children.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    if(!TouristsAuth.navigator){
        commentCount=nodeMap.size;
    }



    return [Pnodes, nodeMap, commentCount];
}
export function formatCommentTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();

    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);

    // 今天和昨天的零点
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayZero = new Date(todayZero.getTime() - 86400000);

    // 1 小时以内 → "刚刚" / "x分钟前"
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;

    // 5 小时以内 → "x小时前"
    if (diffHour < 5) return `${diffHour}小时前`;

    // 今天（超过5小时但在今天内）→ "今天 HH:mm"
    if (date >= todayZero) {
        return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    // 昨天 → "昨天"
    if (date >= yesterdayZero) {
        return '昨天';
    }

    // 今年 → "x月x日"
    if (date.getFullYear() === now.getFullYear()) {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }

    // 去年及更早 → "xxxx年x月x日"
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function pad(n) {
    return n < 10 ? '0' + n : n;
}


export const formatDate = (val, type = 'YYYY年MM月DD日') => {
    val = new Date(val).getTime();
    return dayjs(val).format(type);
};

export const formatBirth = (id) => {
    let birthday = '';
    if (id.length === 15) {
        birthday = '19' + id.slice(6, 12);
    } else if (id.length === 18) {
        birthday = id.slice(6, 14);
    }
    birthday = birthday.replace(/(.{4})(.{2})/, '$1-$2-');
    return birthday;
};

export const formatYear = (id, type) => {
    let year = '';
    const dateNow = new Date();

    if (type === 'age') {
        year = formatBirth(id); //-
    }
    return dateNow.getFullYear() - year.substring(0, 4);
};


// 格式化时间
export const formatTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`//:${seconds}`;
};


/**
 * 根据指定 key 对齐对象数组中的标签文本
 * @param {Array<Object>} data - 原始对象数组
 * @param {string} key - 需要对其的字段名 (例如 'label' 或 'title')
 * @param {string} fillChar - 填充字符，默认为全角空格 ' ' (视觉对齐效果更好)
 * @returns {Array<Object>} 新的对象数组，原数组不受影响
 */
export function alignLabelsByField(data, key, fillChar = ' ') {
    if (!data || !Array.isArray(data) || !key) return data;

    // 辅助函数：计算字符串的“视觉宽度”
    // 逻辑：中文/全角符号算 2 个单位，英文/数字算 1 个单位
    const getVisualLength = (str) => {
        let len = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            // 判断是否为中文、全角标点等 (Unicode范围大致覆盖)
            if ((code >= 0x4e00 && code <= 0x9fa5) || (code >= 0xff00 && code <= 0xffef)) {
                len += 2;
            } else {
                len += 1;
            }
        }
        return len;
    };

    // 1. 找出该字段在所有对象中的最大视觉宽度
    const maxLen = Math.max(...data.map(item => getVisualLength(String(item[key] || ''))));

    // 2. 遍历并生成新数组（浅拷贝对象，防止修改原数据）
    return data.map(item => {
        const text = String(item[key] || '');
        const currentLen = getVisualLength(text);
        const diff = maxLen - currentLen;

        // 3. 拼接填充字符（尾部填充，保持左对齐阅读习惯）
        // 注意：如果 font-family 不是等宽字体，空格可能还是对不齐，建议配合 CSS monospace
        const newText = text + fillChar.repeat(diff);

        return {
            ...item,
            [key]: newText
        };
    });
}


export function maskRandomly(str) {
    // 如果输入不是字符串或为空，直接返回空字符串
    if (typeof str !== 'string' || str.length === 0) {
        return '';
    }

    // 随机决定掩码长度：至少1，最多为字符串长度
    const maskLength = Math.floor(Math.random() * str.length) + 1;

    // 随机决定起始位置：保证掩码不越界
    const startPos = Math.floor(Math.random() * (str.length - maskLength + 1));

    // 提取被掩码的原始字符
    const maskedPart = str.substring(startPos, startPos + maskLength);

    // 构建结果字符串：前段 + 星号掩码 + 后段
    const result =
        str.substring(0, startPos) +
        '*'.repeat(maskLength) +
        str.substring(startPos + maskLength);

    // 返回一个对象，包含完整结果和被掩码的原始字符
    return {
        result: result,
        maskedOriginal: maskedPart,
        maskLength: maskLength,
        startPos: startPos
    };
}


/**
 * 判断当前是否是手机 / 平板等非 PC 设备
 * 用于移动端访问拦截：命中后直接渲染提示页，不初始化路由、不发起任何接口请求
 */
export function isMobileDevice() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    const ua = navigator.userAgent || '';
    // 常见移动端 UA
    const uaMobile = /Android|iPhone|iPad|iPod|Windows Phone|HarmonyOS|Mobile/i.test(ua);
    // iPadOS 13+ 的 UA 伪装成 Macintosh，用触控点数量辅助判断
    const iPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    // 兜底：窄屏（防止 UA 被篡改）
    const narrow = window.matchMedia?.('(max-width: 768px)')?.matches;

    return uaMobile || iPadOS || !!narrow;
}