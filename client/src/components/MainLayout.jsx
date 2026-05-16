import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Layout, Input, Button, Tag, Space, Typography, Spin } from 'antd';
import { SearchOutlined, MenuOutlined, GithubOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Header, Footer } = Layout;
const { Text, Title } = Typography;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/tags').then(res => setTags(res.data)).catch(() => {});
    api.get('/links').then(res => setLinks(res.data)).catch(() => {});
  }, []);

  const handleSearch = () => {
    if (keyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const navItems = [
    { label: '首页', path: '/' },
    ...categories.map(c => ({ label: c.name, path: `/category/${c.id}` })),
    { label: '归档', path: '/archive' },
    { label: '关于', path: '/about' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d1117' }}>
      <Header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#161b22', borderBottom: '1px solid #30363d',
        display: 'flex', alignItems: 'center', padding: '0 24px', height: 56,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: 32 }}>
          <Title level={4} style={{ color: '#58a6ff', margin: 0 }}>PersonalBlog</Title>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }} className="nav-links">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Button key={item.path} type="text" size="small"
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}>
                {item.label}
              </Button>
            );
          })}
        </div>
        <Space>
          <Input
            size="small" placeholder="搜索文章..." prefix={<SearchOutlined />}
            value={keyword} onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200, background: '#0d1117', borderColor: '#30363d', color: '#e6edf3' }}
          />
          <Button type="text" size="small" icon={<MenuOutlined />}
            onClick={() => setMobileMenu(!mobileMenu)} className="mobile-menu-btn" />
        </Space>
      </Header>

      {/* 内容区：左侧文章列表 + 右侧边栏 */}
      <div style={{ background: '#0d1117', maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1, width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }} className="page-fade-in" key={location.pathname}>
          <Outlet context={{ categories, tags }} />
        </div>
        <aside style={{ width: 280, marginLeft: 24, flexShrink: 0 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#e6edf3', marginBottom: 12 }}>分类</Title>
            <Space wrap>
              {categories.map(c => (
                <Tag key={c.id} color="blue" style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/category/${c.id}`)}>
                  {c.name} ({c.articleCount})
                </Tag>
              ))}
            </Space>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#e6edf3', marginBottom: 12 }}>标签云</Title>
            <Space wrap>
              {tags.map(t => (
                <Tag key={t.id} style={{ cursor: 'pointer', background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}
                  onClick={() => navigate(`/tag/${t.id}`)}>
                  {t.name}
                </Tag>
              ))}
            </Space>
          </div>
          {links.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ color: '#e6edf3', marginBottom: 12 }}>友情链接</Title>
              <Space wrap>
                {links.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#8b949e', fontSize: 13 }}>{l.name}</a>
                ))}
              </Space>
            </div>
          )}
          <div>
            <Button type="link" icon={<GithubOutlined />} style={{ color: '#8b949e', padding: 0 }}
              onClick={() => navigate('/admin')}>后台管理</Button>
          </div>
        </aside>
      </div>

      <Footer style={{ textAlign: 'center', background: '#161b22', color: '#484f58', borderTop: '1px solid #30363d', padding: '16px' }}>
        PersonalBlog © {new Date().getFullYear()}  |  Powered by React + Express + MySQL
      </Footer>
    </Layout>
  );
}
