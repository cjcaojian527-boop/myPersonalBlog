import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Typography, Tag, Space, Button, Divider, Input, Skeleton, message, Image } from 'antd';
import { LikeOutlined, LikeFilled, EyeOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined, HomeOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import dayjs from 'dayjs';
import api from '../services/api';
import CommentSection from '../components/CommentSection';
import useAuthStore from '../store/authStore';

const { Title, Text } = Typography;

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [article, setArticle] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/articles/${id}`)
      .then(res => setArticle(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));

    if (token) {
      api.get('/likes/status', { params: { articleId: id } })
        .then(res => setLiked(res.data.liked))
        .catch(() => {});
    }

    // 浏览量 +1：useRef 防止 StrictMode 双重渲染导致 +2
    if (!viewedRef.current) {
      viewedRef.current = true;
      api.put(`/articles/${id}/view`).catch(() => {});
    }
  }, [id, token]);

  const handleLike = async () => {
    if (!token) return message.info('请先登录');
    setLikeLoading(true);
    try {
      const res = await api.post('/likes/toggle', { articleId: id });
      setLiked(res.data.liked);
      setArticle(prev => ({
        ...prev,
        likeCount: prev.likeCount + (res.data.liked ? 1 : -1),
      }));
      message.success(res.data.message);
    } catch (err) {}
    setLikeLoading(false);
  };

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} style={{ background: '#161b22', padding: 24, borderRadius: 8 }} />;
  if (!article) return null;

  return (
    <div>
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#8b949e' }}>
        <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> 首页</Link>
        {article.category && (
          <>
            <span style={{ margin: '0 8px' }}>/</span>
            <Link to={`/category/${article.category.id}`} style={{ color: '#8b949e' }}>{article.category.name}</Link>
          </>
        )}
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#e6edf3' }}>{article.title}</span>
      </div>

      {article.coverImage && (
        <Image src={article.coverImage} alt={article.title}
          style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, marginBottom: 24 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        />
      )}

      <Title level={2} style={{ color: '#e6edf3', marginBottom: 12 }}>{article.title}</Title>

      <Space size={16} style={{ color: '#484f58', fontSize: 13, marginBottom: 24 }} wrap>
        <span><ClockCircleOutlined /> {dayjs(article.createdAt).format('YYYY-MM-DD HH:mm')}</span>
        <span><EyeOutlined /> {article.viewCount} 阅读</span>
        <span><LikeOutlined /> {article.likeCount} 点赞</span>
        {article.author && <span>作者：{article.author.nickname}</span>}
        {article.category && <Tag color="blue">{article.category.name}</Tag>}
        {article.tags?.map(t => <Tag key={t.id} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}>{t.name}</Tag>)}
      </Space>

      <div className="article-content" style={{ background: '#161b22', borderRadius: 8, padding: 32, marginBottom: 24 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]}>
          {article.content}
        </ReactMarkdown>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Button
          type={liked ? 'primary' : 'default'}
          icon={liked ? <LikeFilled /> : <LikeOutlined />}
          onClick={handleLike}
          loading={likeLoading}
          size="large"
          style={{ borderRadius: 20, minWidth: 120 }}
        >
          {liked ? '已点赞' : '点赞'} ({article.likeCount})
        </Button>
      </div>

      <Divider style={{ borderColor: '#30363d' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        {article.prev ? (
          <Button type="link" icon={<LeftOutlined />} onClick={() => navigate(`/article/${article.prev.id}`)}>
            {article.prev.title}
          </Button>
        ) : <div />}
        {article.next ? (
          <Button type="link" icon={<RightOutlined />} onClick={() => navigate(`/article/${article.next.id}`)}
            style={{ textAlign: 'right' }}>
            {article.next.title}
          </Button>
        ) : <div />}
      </div>

      <CommentSection articleId={id} />
    </div>
  );
}
