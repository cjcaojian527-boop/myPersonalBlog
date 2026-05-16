import { useState, useEffect } from 'react';
import { Input, Button, Typography, message, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminAbout() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/about')
      .then(res => setContent(res.data?.content || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/about', { content });
      message.success('保存成功');
    } catch (err) {}
    setSaving(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>关于我</Title>
        <Button type="primary" onClick={handleSave} loading={saving}>保存</Button>
      </div>
      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
        <div className="markdown-editor" style={{ flex: 1 }}>
          <Input.TextArea value={content} onChange={e => setContent(e.target.value)}
            placeholder="使用 Markdown 编写关于我的内容..."
            style={{ height: '100%', resize: 'none' }} />
        </div>
        <div className="markdown-preview" style={{ flex: 1, overflow: 'auto' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {content || '预览区域'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
