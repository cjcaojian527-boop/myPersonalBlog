import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Button, Select, Space, Typography, message, Upload, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UploadOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import api from '../../services/api';

const { Title } = Typography;

export default function AdminArticleEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({
    title: '', content: '', summary: '', categoryId: null,
    tagIds: [], coverImage: '', status: 'draft',
  });

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/tags').then(res => setTags(res.data)).catch(() => {});

    if (isEdit) {
      setLoading(true);
      api.get(`/articles/${id}`)
        .then(res => {
          const a = res.data;
          setForm({
            title: a.title || '',
            content: a.content || '',
            summary: a.summary || '',
            categoryId: a.categoryId || null,
            tagIds: a.tags?.map(t => t.id) || [],
            coverImage: a.coverImage || '',
            status: a.status || 'draft',
          });
        })
        .catch(() => navigate('/admin/articles'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (status) => {
    if (!form.title.trim()) return message.warning('标题不能为空');
    if (!form.content.trim()) return message.warning('正文不能为空');

    if (!form.summary) {
      const summary = form.content.replace(/[#*`>\[\]!\-\s]/g, '').substring(0, 150);
      setForm(prev => ({ ...prev, summary }));
    }

    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim(), status };
      if (!form.summary) payload.summary = form.content.replace(/[#*`>\[\]!\-\s]/g, '').substring(0, 150);

      if (isEdit) {
        await api.put(`/articles/${id}`, payload);
        message.success('更新成功');
      } else {
        const res = await api.post('/articles', payload);
        message.success('文章创建成功');
        navigate(`/admin/articles/${res.data.article.id}/edit`, { replace: true });
      }
    } catch (err) {}
    setSaving(false);
  };

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload', fd);
      setForm(prev => ({ ...prev, coverImage: res.data.url }));
      message.success('上传成功');
    } catch (err) {}
    return false;
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/articles')}>返回列表</Button>
          <Title level={4} style={{ color: '#e6edf3', margin: 0 }}>{isEdit ? '编辑文章' : '写文章'}</Title>
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} onClick={() => handleSave('draft')} loading={saving}>存草稿</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={() => handleSave('published')} loading={saving}>发布</Button>
        </Space>
      </div>

      <Input size="large" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="文章标题" style={{ marginBottom: 16, background: '#0d1117', borderColor: '#30363d', color: '#e6edf3' }} />

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <Select placeholder="选择分类" value={form.categoryId} onChange={v => setForm({ ...form, categoryId: v })}
            style={{ width: 160 }} options={categories.map(c => ({ label: c.name, value: c.id }))} />
          <Select mode="multiple" placeholder="选择标签" value={form.tagIds} onChange={v => setForm({ ...form, tagIds: v })}
            style={{ minWidth: 200 }} options={tags.map(t => ({ label: t.name, value: t.id }))} />
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />}>上传封面</Button>
          </Upload>
          {form.coverImage && (
            <img src={form.coverImage} alt="cover" style={{ height: 32, borderRadius: 4 }} />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)' }}>
        <div className="markdown-editor" style={{ flex: 1 }}>
          <Input.TextArea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="使用 Markdown 编写文章内容..." style={{ height: '100%', resize: 'none' }} />
        </div>
        <div className="markdown-preview" style={{ flex: 1, overflow: 'auto' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {form.content || '预览区域'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
