import { StyleSheet } from 'react-native';


export const publicStyles = StyleSheet.create({
    // ── 间距：内边距 ─────────────────────────────
    padding_0_10: { paddingVertical: 0, paddingHorizontal: 10 },  // 上下0 左右10（老大已有）
    padding_0_20: { paddingVertical: 0, paddingHorizontal: 20 },
    padding_10_0: { paddingVertical: 10, paddingHorizontal: 0 },  // 上下10 左右0
    padding_10: { padding: 10 },                                  // 四边 10
    padding_20: { padding: 20 },
    padding_v_10: { paddingVertical: 10 },                          // 只管上下
    padding_h_12: { paddingHorizontal: 12 },                        // 只管左右
    padding_top_10: { paddingTop: 10 },

    // ── 间距：外边距 ─────────────────────────────
    margin_0_10: { marginVertical: 0, marginHorizontal: 10 },
    margin_10: { margin: 10 },
    margin_top_10: { marginTop: 10 },
    margin_bottom_10: { marginBottom: 10 },

    // ── Flex：复合类（沿用老大的写法）─────────────
    flex_center: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    flex_space_around: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, // 已有
    flex_space_between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, // 已有
    flex_space_evenly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },

    flex_row: { flexDirection: 'row' },
    flex_column: { flexDirection: 'column' },
    flex_1: { flex: 1 },          // 撑满 / 平分

    // ── 对齐（单个轴的原子类）────────────────────
    items_center: { alignItems: 'center' },
    items_start: { alignItems: 'flex-start' },
    justify_center: { justifyContent: 'center' },
    self_center: { alignSelf: 'center' },      // 只让自己居中，不管别人

    // ── 文字 ────────────────────────────────────
    text_center: { textAlign: 'center' },
    text_right: { textAlign: 'right' },
    font_bold: { fontWeight: '700' },

    // ⚠️ 字号必须跟 lineHeight 成对写，否则中文会被上下裁切
    font_12: { fontSize: 12, lineHeight: 18 },
    font_14: { fontSize: 14, lineHeight: 20 },
    font_16: { fontSize: 16, lineHeight: 24 },
    font_18: { fontSize: 18, lineHeight: 26 },
    font_20: { fontSize: 20, lineHeight: 28 },

    // ── 圆角 / 边框 ─────────────────────────────
    rounded_sm: { borderRadius: 4 },
    rounded_md: { borderRadius: 8 },
    rounded_lg: { borderRadius: 16 },
    rounded_full: { borderRadius: 9999 },   // 胶囊形状（RN 不支持 '50%'）
    border_all: { borderWidth: 1, borderColor: '#e5e5e5' },

    // ── 绝对定位铺满 ────────────────────────────
    absolute_fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },

    // ── 居中（一个类搞定水平和垂直）─────────────
    center_all: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});



export const MIME_TYPE_MAP = {
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
export const ELEMNTTYPE = {
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

export const fallbackSRC = `data:image/png;base64,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`


export const roleOptions = [
    { value: 'super_admin', label: '超级管理员' },
    { value: 'admin', label: '管理员' },
    { value: 'temp_admin', label: '临时管理员' },
]

// ── 后端地址：统一走环境变量 ──────────────────────────────
// EXPO_PUBLIC_* 会在打包时被 Metro 静态替换成字面量，所以必须写成
// process.env.EXPO_PUBLIC_XXX 这种完整形式，不能解构，否则不会内联。
//   本地开发：写在项目根目录的 .env（已被 .gitignore 忽略）
//   云端构建：由 eas.json 里各 profile 的 env 注入
const ENV_CONTEXT_PATH = process.env.EXPO_PUBLIC_CONTEXT_PATH;
const ENV_FILE_BASEURI = process.env.EXPO_PUBLIC_FILE_BASEURI;

if (__DEV__) {
    if (!ENV_CONTEXT_PATH) console.warn('[env] 未配置 EXPO_PUBLIC_CONTEXT_PATH，已使用兜底地址');
    if (!ENV_FILE_BASEURI) console.warn('[env] 未配置 EXPO_PUBLIC_FILE_BASEURI，已使用兜底地址');
}

// 兜底值只在环境变量缺失时生效，正式值以 .env / eas.json 为准
export const CONTEXT_PATH = ENV_CONTEXT_PATH;
export const TOKEN_NAME = 'Authorization';
export const Tourists_TOKEN_NAME = 'TouristsAuthorization';

export const FILE_BASEURI = ENV_FILE_BASEURI;
export const BASEURINAME = '/blog';
export const BASEURI = BASEURINAME;//import.meta.env.DEV ? '' : BASEURINAME;
// 国密 SM2 公钥（公开的，谁看到都无所谓 ✅）
export const SM2_PUBLIC_KEY = '041345447327bde9cad79eaefbc18a563b6572709580cdea61fce378bc69bb7f425b8f58a180d8b15b7ee3f96429436f84334e8e60a78bd55568c85f4dd5b0ea42';
export const SM2_CIPHER_MODE = 1;   // ⭐ 必须和后端一致
// 需要加密密码的接口
export const ENCRYPT_PATHS = [
    '/api/auth/Login',
    '/api/auth/Register',
];
