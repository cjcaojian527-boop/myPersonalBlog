import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', url: '', sortOrder: 0 });

  const load = () => {
    setLoading(true);
    api.get('/links').then(res => setLinks(res.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.url.trim()) return message.warning('名称和链接不能为空');
    try {
      if (editing) {
        await api.put(`/links/${editing.id}`, form);
        message.success('更新成功');
      } else {
        await api.post('/links', form);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditing(null);
      setForm({ name: '', url: '', sortOrder: 0 });
      load();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/links/${id}`); message.success('删除成功'); load(); } catch (err) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '链接', dataIndex: 'url', ellipsis: true },
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    { title: '操作', width: 120,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(r); setForm({ name: r.name, url: r.url, sortOrder: r.sortOrder }); setModalOpen(true); }} />
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
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>友情链接</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setForm({ name: '', url: '', sortOrder: 0 }); setModalOpen(true); }}>新增</Button>
      </div>
      <Table dataSource={links} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />
      <Modal title={editing ? '编辑友链' : '新增友链'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Space orientation="vertical" style={{ width: '100%', marginTop: 16 }}>
          <Input placeholder="名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="链接" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        </Space>
      </Modal>
    </div>
  );
}
