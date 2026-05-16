import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Card, Tag, Space, Pagination, Empty, Typography, Radio, Skeleton, Button } from 'antd';
import { EyeOutlined, LikeOutlined, ClockCircleOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Paragraph } = Typography;

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: categoryId, id: tagId } = useParams();
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt');
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // 从 sessionStorage 读取上次查看的文章 ID，用于高亮
  const lastViewedId = sessionStorage.getItem('lastViewedArticle');

  const isCategory = location.pathname.startsWith('/category/');
  const isTag = location.pathname.startsWith('/tag/');

  useEffect(() => {
    setPage(1);
  }, [categoryId, tagId, sort]);

  useEffect(() => {
    setLoading(true);
    const params = { page, pageSize, sort, order: 'DESC', status: 'published' };
    if (isCategory && categoryId) params.categoryId = categoryId;
    if (isTag && tagId) params.tagId = tagId;

    api.get('/articles', { params })
      .then(res => { setArticles(res.data.list); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, categoryId, tagId, sort]);

  return (
    <div>
      {/* 分类/标签筛选时显示面包屑 */}
      {(isCategory || isTag) && (
        <div style={{ marginBottom: 16, fontSize: 13, color: '#8b949e' }}>
          <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> 首页</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#e6edf3' }}>{isCategory ? '分类文章' : '标签文章'}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>
          {isCategory ? '分类文章' : isTag ? '标签文章' : '最新文章'}
        </Title>
        <Radio.Group value={sort} onChange={e => setSort(e.target.value)} size="small" optionType="button" buttonStyle="solid">
          <Radio.Button value="createdAt">最新</Radio.Button>
          <Radio.Button value="viewCount">最多阅读</Radio.Button>
          <Radio.Button value="likeCount">最多点赞</Radio.Button>
        </Radio.Group>
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} active paragraph={{ rows: 2 }} style={{ marginBottom: 16, background: '#161b22', padding: 16, borderRadius: 8 }} />)
      ) : articles.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {articles.map(a => {
            const isLastViewed = String(a.id) === lastViewedId;
            return (
              <Card key={a.id} hoverable onClick={() => {
                sessionStorage.setItem('lastViewedArticle', a.id);
                navigate(`/article/${a.id}`);
              }}
                style={{
                  background: isLastViewed ? '#1c2333' : '#161b22',
                  border: isLastViewed ? '1px solid #58a6ff' : '1px solid #30363d',
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: 20 } }}
              >
                <Link to={`/article/${a.id}`} style={{ color: '#e6edf3' }}>
                  <Title level={4} style={{ color: isLastViewed ? '#58a6ff' : '#e6edf3', marginBottom: 8 }}>{a.title}</Title>
                </Link>
              <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#8b949e', marginBottom: 12 }}>
                {a.summary}
              </Paragraph>
              <Space size={16} style={{ color: '#484f58', fontSize: 12 }} wrap>
                <span><ClockCircleOutlined /> {dayjs(a.createdAt).format('YYYY-MM-DD')}</span>
                <span><EyeOutlined /> {a.viewCount}</span>
                <span><LikeOutlined /> {a.likeCount}</span>
                {a.category && <Tag color="blue">{a.category.name}</Tag>}
                {a.tags?.slice(0, 3).map(t => <Tag key={t.id} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}>{t.name}</Tag>)}
              </Space>
            </Card>
            );
          })}
        </Space>
      )}

      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination current={page} total={total} pageSize={pageSize} onChange={setPage}
            showSizeChanger={false} showTotal={t => `共 ${t} 篇`} />
        </div>
      )}
    </div>
  );
}
