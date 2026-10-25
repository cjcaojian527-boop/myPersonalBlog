import { create } from 'zustand';
// import { redirect } from 'react-router-dom';
// import { persist } from 'zustand/middleware';



const setVale = (key, val, set, get) => {
    try {
        set({ [key]: val });
    } catch (error) {
        console.error('setVale失败：', error);
    }

}
export const useAuthStore = create(
    (set, get) => ({
        token: '',
        TouristsToken: '',
        TouristsAuth: {},
        auth: {},
        setToken: (token) => set({ token }),
        setVale: (key, val) => setVale(key, val, set, get)
    })
)

export const useNav = create(
    (set, get) => ({
        _navigate: null,
        setNavigate: (navigate) => set({ _navigate: navigate }),
        navigate: (path, options) => get()._navigate?.(path, options),
    })
)

// ============================================================
// 前台主题（亮色 / 暗色）
// 只作用于前台：由前台根组件读取本 store，并在挂载时把 data-theme
// 写到 <html> 上、卸载时移除 —— 后台不读它，因此不受影响。
// ============================================================
const THEME_KEY = 'front-theme';

export const useThemeStore = create(
    (set, get) => ({
        // 惰性初始化：直接读 localStorage，刷新后不回退
        theme: localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light',
        setTheme: (theme) => {
            localStorage.setItem(THEME_KEY, theme);
            set({ theme });
        },
        toggleTheme: () => {
            const next = get().theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, next);
            set({ theme: next });
        },
    })
)


export const useMeunStore = create(
    (set, get) => ({
        items: [],
        collapsed: false,
        setVale: (key, val) => setVale(key, val, set, get)
    })
)


export const useTabsStore = create(
    (set, get) => ({
        Tabs: [],
        currentTab: '3',//、、默认高亮首页
        addTabs: (item) => {
            if (!get().Tabs.some(s => s.key == item.key)) {
                set(state => ({ Tabs: [...state.Tabs, item] }))
            }

        },
        deleteTabs: (key, callback) => {
            const tab = get().Tabs.find(f => f.key === key);
            const index = get().Tabs.findIndex(f => f.key === key);
            let nextTab = null;
            if (tab) {
                if (key === get().currentTab) {
                    //叉掉当前聚焦的

                    if (get().Tabs[get().Tabs.length - 1].key === key) {
                        //当前是末尾
                        nextTab = get().Tabs[index - 1];//聚焦前一个
                    } else {
                        nextTab = get().Tabs[index + 1];//聚焦后一个
                    }
                    set(state => ({ Tabs: state.Tabs.filter(t => t.key != key) }));
                    // console.log("nextTab", nextTab);
                    if (nextTab) {
                        get().setVale('currentTab', nextTab.key);
                        callback && callback(nextTab.routepath);
                    }


                } else {
                    set(state => ({ Tabs: state.Tabs.filter(t => t.key != key) }));
                }


            }

        },
        clearTabs: () => set({ Tabs: [] }),
        setVale: (key, val) => setVale(key, val, set, get)
    })
)