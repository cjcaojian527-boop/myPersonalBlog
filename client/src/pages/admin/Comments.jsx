import { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/comments')
      .then(res => setComments(res.data.list || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      message.success('删除成功');
      load();
    } catch (err) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '评论者', dataIndex: ['user', 'nickname'], width: 100 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '文章ID', dataIndex: 'articleId', width: 80 },
    { title: '时间', dataIndex: 'createdAt', width: 160,
      render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', width: 80,
      render: (_, r) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ color: '#e6edf3', marginBottom: 16 }}>评论管理</Title>
      <Table dataSource={comments} columns={columns} rowKey="id" loading={loading} size="small"
        pagination={{ pageSize: 15 }} style={{ background: 'transparent' }} />
    </div>
  );
}
