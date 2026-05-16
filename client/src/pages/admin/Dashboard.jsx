import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography } from 'antd';
import { FileTextOutlined, CommentOutlined, TagsOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminDashboard() {
  const [stats, setStats] = useState({ articles: 0, comments: 0, categories: 0, views: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/articles', { params: { page: 1, pageSize: 1 } }),
      api.get('/comments', { params: { articleId: 1 } }),
      api.get('/categories'),
      api.get('/articles', { params: { page: 1, pageSize: 1, sort: 'viewCount' } }),
    ]).then(([a, c, cat, top]) => {
      setStats({
        articles: a.data.total || 0,
        comments: 0,
        categories: cat.data.length || 0,
        views: 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <Title level={4} style={{ color: '#e6edf3', marginBottom: 24 }}>仪表盘</Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card style={{ background: '#0d1117', border: '1px solid #30363d' }}>
            <Statistic title="文章总数" value={stats.articles} prefix={<FileTextOutlined />} styles={{ content: { color: '#58a6ff' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#0d1117', border: '1px solid #30363d' }}>
            <Statistic title="评论总数" value={stats.comments} prefix={<CommentOutlined />} styles={{ content: { color: '#58a6ff' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#0d1117', border: '1px solid #30363d' }}>
            <Statistic title="分类数量" value={stats.categories} prefix={<TagsOutlined />} styles={{ content: { color: '#58a6ff' } }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: '#0d1117', border: '1px solid #30363d' }}>
            <Statistic title="总阅读量" value={stats.views} prefix={<EyeOutlined />} styles={{ content: { color: '#58a6ff' } }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
