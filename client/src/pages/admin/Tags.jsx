import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/tags').then(res => setTags(res.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return message.warning('名称不能为空');
    try {
      await api.post('/tags', { name: name.trim() });
      message.success('创建成功');
      setModalOpen(false);
      setName('');
      load();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tags/${id}`);
      message.success('删除成功');
      load();
    } catch (err) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: '文章数', dataIndex: 'articleCount', width: 80 },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>标签管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增</Button>
      </div>
      <Table dataSource={tags} columns={columns} rowKey="id" loading={loading} size="small"
        pagination={false} style={{ background: 'transparent' }} />

      <Modal title="新增标签" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Input placeholder="标签名称" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 16 }} />
      </Modal>
    </div>
  );
}
