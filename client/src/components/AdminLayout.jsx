import { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Spin, message } from 'antd';
import {
  DashboardOutlined, FileTextOutlined, AppstoreOutlined,
  TagsOutlined, CommentOutlined, LinkOutlined, SettingOutlined,
  UserOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  HomeOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import useAuthStore from '../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/admin/articles', icon: <FileTextOutlined />, label: '文章管理' },
  { key: '/admin/categories', icon: <AppstoreOutlined />, label: '分类管理' },
  { key: '/admin/tags', icon: <TagsOutlined />, label: '标签管理' },
  { key: '/admin/comments', icon: <CommentOutlined />, label: '评论管理' },
  { key: '/admin/links', icon: <LinkOutlined />, label: '友情链接' },
  { key: '/admin/about', icon: <InfoCircleOutlined />, label: '关于我' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: '博客设置' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    const match = menuItems.find(item => path.startsWith(item.key) && item.key !== '/admin');
    return match ? match.key : path;
  }, [location.pathname]);

  const userMenu = useMemo(() => ({
    items: [
      { key: 'home', icon: <HomeOutlined />, label: '查看博客', onClick: () => navigate('/') },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/admin/login'); } },
    ],
  }), [navigate, logout]);

  useEffect(() => {
    if (!token) {
      message.warning('请先登录');
      navigate('/admin/login', { replace: true, state: { from: location.pathname } });
    }
  }, [token, navigate, location.pathname]);

  if (!token) {
    return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;
  }

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark"
        style={{ background: '#161b22', borderRight: '1px solid #30363d' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #30363d' }}>
          <Text strong style={{ color: '#58a6ff', fontSize: collapsed ? 14 : 16 }}>
            {collapsed ? 'PB' : 'PersonalBlog'}
          </Text>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]}
          items={menuItems} onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none' }} />
      </Sider>
      <Layout>
        <Header style={{ background: '#161b22', borderBottom: '1px solid #30363d', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} style={{ color: '#8b949e', fontSize: 16 }} />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size={28} icon={<UserOutlined />} style={{ background: '#58a6ff' }} />
              <Text style={{ color: '#e6edf3' }}>{user?.nickname || user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, background: '#161b22', borderRadius: 8, padding: 24, minHeight: 280 }}>
          <div className="page-fade-in" key={location.pathname}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}