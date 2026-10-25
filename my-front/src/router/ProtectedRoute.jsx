import { redirect } from 'react-router-dom';
import { useAuthStore, useTabsStore } from '@/store';

let isRefresh = null;


(function () {

    if (localStorage.getItem('useAuthStore') !== null) {
        try {
            const state = JSON.parse(localStorage.getItem('useAuthStore'));
            // console.log(state);
            useAuthStore.setState({ ...useAuthStore.getState(), ...state });
            localStorage.removeItem('useAuthStore');
        } catch (error) {
            console.error('恢复状态失败', error);
        }
    }

    const handleBeforeUnload = () => {
        const state = JSON.parse(JSON.stringify(useAuthStore.getState()));
        localStorage.setItem('useAuthStore', JSON.stringify(state));


    }


    window.addEventListener('beforeunload', handleBeforeUnload);
})()


//路由守卫
export default function ProtectedLoader(obj) {
    const { token, setToken, setVale } = useAuthStore.getState();
    const { clearTabs } = useTabsStore.getState();
    let { pattern: toPath, params } = obj;
    // console.log('路由守卫---->>' + toPath + '\n', obj);

    if (toPath === '/Login') {
        //浏览器输入框去登录的话清理token
        setToken('');
        setVale('TouristsAuth', {});
        clearTabs();
        return null;
    }

    if (!token || token.trim().length == 0) {
        throw redirect('/Login');
        return null;
    }
    if ("*" in params && params['*'] === 'index' && toPath.endsWith('*')) {
        toPath = toPath.substring(0, toPath.length - 2)
        throw redirect(toPath);
        return null;
    }
    if (!isRefresh) {
        //首次进入 如果是/admin/* 直接加载首页
        isRefresh = true;
        if (toPath.startsWith('/admin') && toPath.split('/').length - 1 > 1) {
            throw redirect('/admin');
        }

        return null;
    }


    return null; // ✅ 安全放行

}