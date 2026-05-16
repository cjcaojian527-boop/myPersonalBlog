import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Skeleton } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import api from '../services/api';
import { HomeOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function About() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/about')
      .then(res => setAbout(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton active paragraph={{ rows: 5 }} style={{ background: '#161b22', padding: 24, borderRadius: 8 }} />;

  return (
    <div>
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#8b949e' }}>
        <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> 首页</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#e6edf3' }}>关于我</span>
      </div>
      <Title level={4} style={{ color: '#e6edf3', marginBottom: 24 }}>关于我</Title>
      <div className="article-content" style={{ background: '#161b22', borderRadius: 8, padding: 32 }}>
        {about?.content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {about.content}
          </ReactMarkdown>
        ) : (
          <p style={{ color: '#8b949e' }}>暂无介绍</p>
        )}
      </div>
    </div>
  );
}
