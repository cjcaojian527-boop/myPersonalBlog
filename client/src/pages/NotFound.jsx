import { Link } from 'react-router-dom';
import { Button, Result } from 'antd';

export default function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，你访问的页面不存在。"
      extra={
        <Button type="primary" onClick={() => window.location.href = '/'}>
          返回首页
        </Button>
      }
      style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    />
  );
}