import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, Tag, Space, Pagination, Empty, Typography, Skeleton, Input } from 'antd';
import { EyeOutlined, LikeOutlined, ClockCircleOutlined, SearchOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Paragraph } = Typography;

export default function SearchResult() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const [searchInput, setSearchInput] = useState(keyword);
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = (kw, p = 1) => {
    if (!kw.trim()) return;
    setLoading(true);
    setSearchParams({ keyword: kw });
    api.get('/articles/search', { params: { keyword: kw, page: p, pageSize: 10 } })
      .then(res => { setArticles(res.data.list); setTotal(res.data.total); setSearched(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (keyword) {
      setSearchInput(keyword);
      doSearch(keyword, 1);
    }
  }, []);

  const handleSearch = () => doSearch(searchInput);

  return (
    <div>
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#8b949e' }}>
        <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> 首页</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#e6edf3' }}>搜索"{keyword}"</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Input.Search
          value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onSearch={handleSearch} enterButton
          size="large"
          placeholder="搜索文章（标题 + 正文 + 标签）"
          style={{ background: '#161b22' }}
        />
      </div>

      {searched && (
        <Title level={5} style={{ color: '#8b949e', marginBottom: 16 }}>
          搜索 "{keyword}"：{loading ? '搜索中...' : `找到 ${total} 篇文章`}
        </Title>
      )}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} active paragraph={{ rows: 2 }} style={{ marginBottom: 16, background: '#161b22', padding: 16, borderRadius: 8 }} />)
      ) : searched && articles.length === 0 ? (
        <Empty description="未找到相关内容" />
      ) : (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {articles.map(a => (
            <Card key={a.id} hoverable onClick={() => navigate(`/article/${a.id}`)}
              style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, cursor: 'pointer' }}
              styles={{ body: { padding: 20 } }}>
              <Title level={4} style={{ color: '#e6edf3', marginBottom: 8 }}>{a.title}</Title>
              <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#8b949e', marginBottom: 12 }}>{a.summary}</Paragraph>
              <Space size={16} style={{ color: '#484f58', fontSize: 12 }} wrap>
                <span><ClockCircleOutlined /> {dayjs(a.createdAt).format('YYYY-MM-DD')}</span>
                <span><EyeOutlined /> {a.viewCount}</span>
                <span><LikeOutlined /> {a.likeCount}</span>
                {a.category && <Tag color="blue">{a.category.name}</Tag>}
              </Space>
            </Card>
          ))}
        </Space>
      )}

      {total > 10 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination current={page} total={total} pageSize={10}
            onChange={p => { setPage(p); doSearch(keyword, p); }}
            showSizeChanger={false} showTotal={t => `共 ${t} 篇`} />
        </div>
      )}
    </div>
  );
}
