import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Timeline, Skeleton, Empty } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title } = Typography;

export default function Archive() {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/articles/archive')
      .then(res => setArchive(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} style={{ background: '#161b22', padding: 24, borderRadius: 8 }} />;

  if (archive.length === 0) return <Empty description="暂无文章" />;

  return (
    <div>
      {/* 面包屑导航 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#8b949e' }}>
        <Link to="/" style={{ color: '#8b949e' }}><HomeOutlined /> 首页</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#e6edf3' }}>文章归档</span>
      </div>
      <Title level={4} style={{ color: '#e6edf3', marginBottom: 24 }}>文章归档</Title>
      {archive.map(group => (
        <div key={group.date} style={{ marginBottom: 32 }}>
          <Title level={5} style={{ color: '#58a6ff', marginBottom: 16 }}>
            {group.date} （{group.count} 篇）
          </Title>
          <Timeline items={group.articles.map(a => ({
            children: (
              <Link to={`/article/${a.id}`} style={{ color: '#c9d1d9', fontSize: 14 }}>
                {a.title}
                <span style={{ color: '#484f58', fontSize: 12, marginLeft: 12 }}>
                  {dayjs(a.createdAt).format('MM-DD')}
                </span>
              </Link>
            ),
          }))} />
        </div>
      ))}
    </div>
  );
}
