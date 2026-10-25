import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom';

import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN'
import { initRouter } from './router/index.jsx';
import { isMobileDevice } from './utils/utils';
import MobileTip from './components/MobileTip';
import "./styles/index.scss";



const App = () => {
  const [router, setRouter] = useState(null);
  // 只判断一次：命中移动端后，不初始化路由、不挂载首页，避免任何接口请求
  const [mobile] = useState(isMobileDevice);

  useEffect(() => {
    if (mobile) return;
    initRouter().then(setRouter);
  }, [mobile]);

  if (mobile) return <MobileTip />;
  if (!router) return <div>Loading...</div>;

  return <RouterProvider router={router} />
}

const container = document.getElementById('root');

// HMR 会让本模块重复执行，复用已有 root，避免重复 createRoot
if (!container.__reactRoot) {
  container.__reactRoot = createRoot(container);
}

container.__reactRoot.render(
  <ConfigProvider locale={zhCN}>
    <AntdApp>
      <App />
    </AntdApp>
  </ConfigProvider>
)

