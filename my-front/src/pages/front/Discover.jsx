import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ArticleWaterfall from '@views/ArticleWaterfall';

// 前台「发现」页 —— 文章瀑布流。
// 数据与事件由 Home 布局通过 <Outlet context> 传下来，切换路由时布局不会卸载。
const Discover = () => {
    const ctx = useOutletContext();
    return <ArticleWaterfall {...ctx} />;
};

export default Discover;
