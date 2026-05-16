import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tag, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminArticles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    api.get('/articles', { params: { page: p, pageSize: 10 } })
      .then(res => { setArticles(res.data.list); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/articles/${id}`);
      message.success('删除成功');
      load(page);
    } catch (err) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', ellipsis: true,
      render: (t, r) => <Link to={`/article/${r.id}`} style={{ color: '#58a6ff' }}>{t}</Link> },
    { title: '分类', dataIndex: ['category', 'name'], width: 100,
      render: v => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '状态', dataIndex: 'status', width: 80,
      render: v => <Tag color={v === 'published' ? 'green' : 'orange'}>{v === 'published' ? '已发布' : '草稿'}</Tag> },
    { title: '阅读', dataIndex: 'viewCount', width: 60 },
    { title: '点赞', dataIndex: 'likeCount', width: 60 },
    { title: '发布时间', dataIndex: 'createdAt', width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/articles/${r.id}/edit`)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>文章管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/articles/new')}>写文章</Button>
      </div>
      <Table dataSource={articles} columns={columns} rowKey="id" loading={loading} size="small"
        pagination={{ current: page, total, pageSize: 10, onChange: setPage, showTotal: t => `共 ${t} 篇` }}
        style={{ background: 'transparent' }} />
    </div>
  );
}
