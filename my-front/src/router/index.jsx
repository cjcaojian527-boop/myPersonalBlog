// import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedLoader from './ProtectedRoute';
import ErrorFallback from '@/views/ErrorFallback';
import { useMeunStore } from '@/store';
import { initMenus, deepClone } from '@utils/utils';
import { BASEURINAME } from '@utils/const'
const pages = import.meta.glob('/src/pages/**/*.jsx', { import: 'default' });

let defaultRouter = [
    {
        // 根路径统一进入前台首页
        path: '/',
        element: <Navigate to='/home' replace />
    },
    {
        // 前台布局：头部 + 侧边栏 + 弹窗，内容区由子路由决定
        path: '/home',
        lazy: () => import('@/pages/front/Home').then(module => ({ Component: module.default })),
        children: [
            {
                // 默认「发现」页：文章瀑布流
                index: true,
                lazy: () => import('@/pages/front/Discover').then(module => ({ Component: module.default }))
            },
            {
                // 「BLUE」页：暂不写内容
                path: 'blue',
                lazy: () => import('@/pages/front/Blue').then(module => ({ Component: module.default }))
            },
            {
                // 「个人」页：暂不写内容，进入时自动打开游客登录弹窗
                path: 'profile',
                lazy: () => import('@/pages/front/Profile').then(module => ({ Component: module.default }))
            }
        ]
    },
    {
        path: '*',
        lazy: () => import('@/views/404page').then(module => ({ Component: module.default }))
    },
    // {
    //     path: '/Login',
    //     loader: checkAuth,// 在这里做守卫
    //     lazy: () => import('@/pages/admin/Login').then(module => ({ Component: module.default }))
    // },
    // {
    //     path: '/admin',
    //     children: adminChildren,
    //     loader: checkAuth,// 在这里做守卫
    //     lazy: () => import('@/pages/admin/Home').then(module => ({ Component: module.default }))
    // },
    // {
    //     path: '/ErrorFallback',
    //     Component: ErrorFallback
    // },
];

const checkList = ['/Login', '/admin'];//守卫白名单

console.log("import.meta.env.DEV:", import.meta.env)


const transformRoutes = (list, AllList) => {
    const sourceList = AllList || deepClone(list);
    let filterList = deepClone(list.filter(f => f.path !== '#' && f.componentPath !== '#'));
    if (deepClone(list.filter(f => f.path == '#' || f.componentPath == '#')).length) {

        deepClone(list.filter(f => f.path == '#' || f.componentPath == '#')).forEach(m => {
            if (sourceList.filter(f => f.pid === m.id).length && m.pid !== -1) {
                filterList = [...filterList, ...sourceList.filter(f => f.pid === m.id)]
            }
        });
        if (!filterList.length) return [];
    }


    return filterList.map(m => {
        const childrens = sourceList.filter(f => f.pid === m.id);
        const key = `/src/pages${m.componentPath}.jsx`;
        const loaderPage = pages[key];
        if (!loaderPage) {
            console.warn('菜单配的组件找不到:', key);
        }
        const item = {
            path: m.path,
            id: m.id,
            pid: m.pid,
            label: m.label,
            lazy: loaderPage
                ? () => loaderPage().then(Component => ({ Component }))
                : () => {
                    if (import.meta.env.DEV) {
                        return Promise.reject(new Error(`菜单组件不存在: ${key}`));
                    }
                    return import('@/views/404page').then(mod => ({ Component: mod.default }));
                },

            // 错误边界组件
            ErrorBoundary: ErrorFallback
        }
        if (checkList.some(s => m.path.startsWith(s))) {
            item.loader = ProtectedLoader;//在这里做守卫
        }
        if (m.pid !== -1 && sourceList.some(f => f.id == m.pid) && item.path === 'index') {
            //找到父
            item.index = true;
            delete item.path;
        }
        if (childrens.length) {
            //找到子
            item.children = [...transformRoutes(childrens, sourceList), {
                path: '*',
                lazy: () => import('@/views/404page').then(module => ({ Component: module.default }))
            }];
        }
        return item;
    });

}

const transformMenus = (list, AllList) => {
    const sourceList = AllList || deepClone(list);
    const arr = list.map(m => {
        const childrens = sourceList.filter(f => f.pid == m.id);
        const item = {
            pid: m.pid,
            key: m.id + '',
            label: m.label,
            icon: m.icon,
            disabled: !m.display,
            routepath: m.absolutePath,
            children: childrens.length ? transformMenus(childrens, sourceList) : []
        }

        return item;
    });
    return arr;
}
let suorceMenus = [];


//动态加载路由
async function initRouter() {

    const { setVale } = useMeunStore.getState();
    let Menus = await initMenus();
    // console.log("Menus:", Menus);
    suorceMenus = deepClone(Menus);
    const routerList = transformRoutes(Menus).filter(f => f.children || f.pid == -1 || f.path?.startsWith('/'));
    const meunStroe = transformMenus(Menus).filter(f => f.pid == -1);
    setVale('items', meunStroe);
    console.log("最终路由表:", routerList);


    return createBrowserRouter([...defaultRouter, ...routerList], {
        basename: import.meta.env.DEV ? '/' : BASEURINAME
    })

}



export { initRouter, suorceMenus };