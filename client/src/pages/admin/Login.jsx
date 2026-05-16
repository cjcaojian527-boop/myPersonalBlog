import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const { Title, Text } = Typography;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // 获取登录前的来源页面，登录后跳回
  const from = location.state?.from || '/admin';

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      login(res.data.user, res.data.token);
      message.success('登录成功');
      navigate(from, { replace: true });
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#0d1117',
    }}>
      <Card style={{ width: 400, background: '#161b22', border: '1px solid #30363d' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#58a6ff', margin: 0 }}>PersonalBlog</Title>
          <Text style={{ color: '#8b949e' }}>后台管理登录</Text>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')} style={{ color: '#8b949e' }}>返回博客首页</Button>
        </div>
      </Card>
    </div>
  );
}
