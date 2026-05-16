import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Typography, message, Spin } from 'antd';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await api.put('/settings', { key, value: String(value) });
      }
      message.success('设置已更新');
    } catch (err) {}
    setSaving(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Title level={4} style={{ color: '#e6edf3', marginBottom: 24 }}>博客设置</Title>
      <Form layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item label="网站名称">
          <Input value={settings.site_name || ''}
            onChange={e => setSettings({ ...settings, site_name: e.target.value })} />
        </Form.Item>
        <Form.Item label="网站描述">
          <Input.TextArea value={settings.site_description || ''} rows={2}
            onChange={e => setSettings({ ...settings, site_description: e.target.value })} />
        </Form.Item>
        <Form.Item label="每页文章数">
          <InputNumber value={Number(settings.page_size) || 10} min={1} max={50}
            onChange={v => setSettings({ ...settings, page_size: v })} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave} loading={saving}>保存设置</Button>
        </Form.Item>
      </Form>
    </div>
  );
}
