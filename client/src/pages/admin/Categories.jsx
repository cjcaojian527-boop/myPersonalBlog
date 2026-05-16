import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', sortOrder: 0 });

  const load = () => {
    setLoading(true);
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return message.warning('名称不能为空');
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        message.success('更新成功');
      } else {
        await api.post('/categories', form);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', slug: '', description: '', sortOrder: 0 });
      load();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('删除成功');
      load();
    } catch (err) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug' },
    { title: '文章数', dataIndex: 'articleCount', width: 80 },
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    { title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(r); setForm({ name: r.name, slug: r.slug, description: r.description || '', sortOrder: r.sortOrder || 0 }); setModalOpen(true); }} />
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
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>分类管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setForm({ name: '', slug: '', description: '', sortOrder: 0 }); setModalOpen(true); }}>新增</Button>
      </div>
      <Table dataSource={categories} columns={columns} rowKey="id" loading={loading} size="small"
        pagination={false} style={{ background: 'transparent' }} />

      <Modal title={editing ? '编辑分类' : '新增分类'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Space orientation="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Input placeholder="名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="描述" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Space>
      </Modal>
    </div>
  );
}
