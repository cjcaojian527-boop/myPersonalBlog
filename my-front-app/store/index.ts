import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type ArticleItem } from '@/components/ArticleCard';
import { encryptedStorage } from '@/utils/persistStorage';
// 假数据，等后端有搜索历史接口了再换掉（清空成 [] 就行）
const HISTORY_MOCK = [
    '马来西亚数字游民签证',
    '美式ins壁纸图',
    '手机全屏壁纸图片',
    'INs高级壁纸图',
    '虎跳峡徒步路线图',
];

interface HistoryState {
    historyList: string[];
    keyword: string;

}

interface IN_TouristsAuth {
    TouristsAuth: { [key: string]: any };
    TouristsToken: string;

}

export const useHistoryList = create<HistoryState>((set) => ({
    historyList: HISTORY_MOCK,
    keyword: '',
}));

export const useCurrentArticle = create<ArticleItem | { [key: string]: any }>((set) => ({
    Article: {}
}));

// 登录态持久化：token 和游客信息一起走 SM4 加密后落到 AsyncStorage，
// 密钥单独放在 SecureStore。热更新 / 杀进程重启后都能恢复，不用重新登录
export const useAuthStore = create<IN_TouristsAuth>()(
    persist(
        () => ({
            TouristsToken: '',
            TouristsAuth: {}
        }),
        {
            // AsyncStorage 里的 key，存的值是 SM4 密文
            name: 'auth-store',
            storage: createJSONStorage(() => encryptedStorage),
            // 以后数据结构变了，升版本号并在 migrate 里处理旧数据
            version: 1,
        }
    )
)
