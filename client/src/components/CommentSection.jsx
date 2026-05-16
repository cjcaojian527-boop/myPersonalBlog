import { useState, useEffect } from 'react';
import { Input, Button, Avatar, Space, Typography, message, List, Divider } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const { Text, Title } = Typography;

export default function CommentSection({ articleId }) {
  const { token, user } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = () => {
    api.get('/comments', { params: { articleId } })
      .then(res => setComments(res.data.list || []))
      .catch(() => {});
  };

  const loadCaptcha = () => {
    api.get('/captcha/generate')
      .then(res => {
        setCaptchaId(res.data.captchaId);
        setCaptchaSvg(res.data.svg);
      })
      .catch(() => {});
  };

  useEffect(() => { loadComments(); loadCaptcha(); }, [articleId]);

  const handleSubmit = async () => {
    if (!token) return message.warning('请先登录后再评论');
    if (!content.trim()) return message.warning('评论内容不能为空');
    if (!captcha.trim()) return message.warning('请输入验证码');

    setSubmitting(true);
    try {
      await api.post('/comments', {
        articleId,
        content: content.trim(),
        parentId: replyTo?.id || null,
        replyToUserId: replyTo?.userId || null,
        captchaId,
        captcha: captcha.trim(),
      });
      setContent('');
      setCaptcha('');
      setReplyTo(null);
      loadComments();
      loadCaptcha();
      message.success('评论发表成功');
    } catch (err) {
      loadCaptcha();
    }
    setSubmitting(false);
  };

  const renderComment = (c, depth = 0) => (
    <div key={c.id} style={{ marginLeft: depth > 0 ? 32 : 0, marginTop: 12 }}>
      <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, border: '1px solid #30363d' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar size={28} icon={<UserOutlined />} style={{ background: '#58a6ff' }} />
            <Text strong style={{ color: '#e6edf3' }}>{c.user?.nickname || c.user?.username}</Text>
            {c.replyToUser && <Text style={{ color: '#8b949e', fontSize: 12 }}>回复 @{c.replyToUser.nickname}</Text>}
            <Text style={{ color: '#484f58', fontSize: 12 }}>{dayjs(c.createdAt).format('MM-DD HH:mm')}</Text>
          </Space>
        </Space>
        <div style={{ color: '#c9d1d9', marginTop: 8 }}>{c.content}</div>
        {token && depth === 0 && (
          <Button type="link" size="small" onClick={() => setReplyTo({ id: c.id, userId: c.user?.id, name: c.user?.nickname })}
            style={{ color: '#58a6ff', padding: 0, marginTop: 8 }}>
            回复
          </Button>
        )}
        {replyTo?.id === c.id && (
          <div style={{ marginTop: 8 }}>
            <Input.TextArea rows={2} value={content} onChange={e => setContent(e.target.value)}
              placeholder={`回复 @${replyTo.name}`} style={{ marginBottom: 8, background: '#161b22', borderColor: '#30363d' }} />
            <Space>
              <Button size="small" onClick={handleSubmit} type="primary" loading={submitting} icon={<SendOutlined />}>提交</Button>
              <Button size="small" onClick={() => { setReplyTo(null); setContent(''); }}>取消</Button>
            </Space>
          </div>
        )}
      </div>
      {c.children?.map(ch => renderComment(ch, depth + 1))}
    </div>
  );

  return (
    <div>
      <Title level={5} style={{ color: '#e6edf3', marginBottom: 16 }}>
        评论 ({comments.reduce((s, c) => s + 1 + (c.children?.length || 0), 0)})
      </Title>

      {comments.map(c => renderComment(c))}

      <Divider style={{ borderColor: '#30363d' }} />

      {token ? (
        <div style={{ background: '#161b22', borderRadius: 8, padding: 16, border: '1px solid #30363d', marginTop: 16 }}>
          <Text style={{ color: '#e6edf3' }}>发表评论</Text>
          <Input.TextArea rows={3} value={content} onChange={e => setContent(e.target.value)}
            placeholder="写下你的评论..." style={{ margin: '12px 0', background: '#0d1117', borderColor: '#30363d' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Input size="small" value={captcha} onChange={e => setCaptcha(e.target.value)}
                placeholder="验证码" style={{ width: 100, background: '#0d1117', borderColor: '#30363d' }}
                onPressEnter={handleSubmit} />
              <div onClick={loadCaptcha} style={{ cursor: 'pointer', width: 80, height: 32 }}
                dangerouslySetInnerHTML={{ __html: captchaSvg }} />
            </Space>
            <Button type="primary" onClick={handleSubmit} loading={submitting} icon={<SendOutlined />}>提交</Button>
          </div>
        </div>
      ) : (
        <Text style={{ color: '#8b949e' }}>请先登录后再评论</Text>
      )}
    </div>
  );
}
