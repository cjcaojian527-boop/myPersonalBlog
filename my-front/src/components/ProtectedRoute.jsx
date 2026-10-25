import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// 路由守卫组件
export default function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null 表示加载中

    useEffect(() => {
        // 检查登录状态
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        checkAuth();
    }, []);

    // 加载中显示 loading
    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    // 未登录跳转登录页
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    // 已登录显示页面
    return children;
}
