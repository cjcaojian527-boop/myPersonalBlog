import React, { useCallback, useEffect, useState } from 'react';
import { App, Avatar, Button, Empty, Form, Input, Modal, Spin, Tag } from 'antd';
import {
    SignatureOutlined, LogoutOutlined, CalendarOutlined,
    DesktopOutlined, EnvironmentOutlined, HeartOutlined, StarOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { getRequest, postRequest } from '@utils/api';
import { FILE_BASEURI } from '@utils/const';
import { parseUA, formatDate, buildDefaultFileList } from '@utils/utils';
import ArticlePreviewComp from '@views/articlePreview';
import { useAuthStore } from '@/store';
import imgError from '@assets/imgerror.png';
import './scss/profile';

const countIds = (str) => (str ? str.split(',').filter(Boolean).length : 0);

const TABS = [
    { key: 'collect', label: '收藏', empty: '还没有收藏任何内容' },
    { key: 'like', label: '点赞', empty: '还没有点赞任何内容' },
];

// ============================================================
// 前台「个人」页：
//   · 未登录 → 独立的登录 / 注册表单（不再用弹窗）
//   · 已登录 → 参考小红书的个人主页，展示头像、资料、数据与内容 Tab
// ============================================================
const Profile = () => {
    const { message: messageApi, modal } = App.useApp();
    const TouristsAuth = useAuthStore(state => state.TouristsAuth);
    const TouristsToken = useAuthStore(state => state.TouristsToken);

    // 有 token 或已有用户信息都视为已登录（登录接口会同时写入两者）
    const loggedIn = !!TouristsToken || !!TouristsAuth?.id;

    // ---- 登录表单状态 ----
    const [mode, set_mode] = useState('login');          // login | register
    const [SVG, set_SVG] = useState({});
    const [submitLoading, set_submitLoading] = useState(false);
    const [form] = Form.useForm();

    // ---- 个人主页状态 ----
    const [tab, set_tab] = useState('collect');
    const [articles, set_articles] = useState([]);              // 收藏 / 点赞对应的文章
    const [articlesLoading, set_articlesLoading] = useState(false);
    const [previewOpen, set_previewOpen] = useState(false);      // 文章详情预览
    const [currentArticle, set_currentArticle] = useState({});
    const [contextList, set_contextList] = useState([]);

    const getCaptchaCode = useCallback(async () => {
        const { code, data } = await getRequest('/api/auth/getCaptchaCode');
        if (code === 0) set_SVG(data);
    }, [set_SVG]);

    const refreshCaptcha = () => {
        getCaptchaCode();
        form.resetFields(['code']);
    };

    // 未登录时，进入页面 / 切换登录注册模式都刷新验证码
    // 放到 setTimeout 里异步执行，避免 React Compiler 把 effect 内的 setState 判定为级联渲染
    useEffect(() => {
        if (loggedIn) return;
        const t = setTimeout(() => getCaptchaCode(), 0);
        return () => clearTimeout(t);
    }, [loggedIn, mode, getCaptchaCode]);

    // 根据「收藏 / 点赞」里保存的文章 id，批量拉取文章
    useEffect(() => {
        if (!loggedIn) return;

        const idStr = tab === 'collect' ? TouristsAuth?.collects : TouristsAuth?.likeStrings;
        const ids = (idStr || '').split(',').filter(Boolean);
        let alive = true;

        // 放到 setTimeout 里异步执行，避免 React Compiler 判定 effect 内同步 setState
        const t = setTimeout(async () => {
            if (!ids.length) {
                if (alive) {
                    set_articles([]);
                    set_articlesLoading(false);
                }
                return;
            }

            set_articlesLoading(true);
            const resp = await postRequest('/api/artcle/getList', {
                formData: { idStrings: ids.join(',') },
                pageSize: 100,
            });

            if (!alive) return;
            set_articles(resp.code === 0 ? (resp.data?.list || []) : []);
            set_articlesLoading(false);
        }, 0);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [tab, loggedIn, TouristsAuth?.collects, TouristsAuth?.likeStrings]);

    // 登录 / 注册提交
    const handleSubmit = async (values) => {
        if (submitLoading) return;
        set_submitLoading(true);

        try {
            const { nickName, email, code } = values;

            if (mode === 'register') {
                const regResp = await postRequest('/api/touristsAuth/Register', {
                    ...values,
                    captchaId: SVG?.captchaId,
                });
                messageApi.open({ type: regResp.code === 0 ? 'success' : 'error', content: regResp.message });
                if (regResp.code !== 0) {
                    refreshCaptcha();
                    return;
                }
            } else {
                const codeResp = await postRequest('/api/auth/verifyCode', {
                    code,
                    captchaId: SVG?.captchaId,
                });
                messageApi.open({ type: codeResp.code === 0 ? 'success' : 'error', content: codeResp.message });
                if (codeResp.code !== 0) {
                    refreshCaptcha();
                    return;
                }
            }

            // 登录（注册成功后也自动登录）
            const loginResp = await postRequest('/api/touristsAuth/Login', { nickName, email });
            messageApi.open({ type: loginResp.code === 0 ? 'success' : 'error', content: loginResp.message });

            if (loginResp.code === 0) {
                const { setVale } = useAuthStore.getState();
                setVale('TouristsAuth', loginResp.data);
            } else {
                refreshCaptcha();
            }
        } finally {
            set_submitLoading(false);
        }
    };

    // 清理登录态（退出登录 / 注销账号共用）
    const clearSession = () => {
        const { setVale, setToken } = useAuthStore.getState();
        setVale('TouristsAuth', {});
        setVale('TouristsToken', '');
        setVale('auth', {});
        setToken('');
    };

    const loginOut = () => {
        clearSession();
        messageApi.success('已退出登录');
    };

    // 注销账号：二次确认 → 调后端 destroyUser → 清理登录态
    const destroyAccount = () => {
        modal.confirm({
            title: '确认注销账号？',
            content: '注销后账号与相关数据将无法恢复，确定要继续吗？',
            okText: '确认注销',
            okButtonProps: { danger: true },
            cancelText: '再想想',
            centered: true,
            onOk: async () => {
                const resp = await postRequest('/api/touristsAuth/destroyUser', {
                    id: TouristsAuth?.id,
                    nickName: TouristsAuth?.nickName,
                    email: TouristsAuth?.email,
                });

                if (resp.code === 0) {
                    messageApi.success(resp.message || '账号已注销');
                    clearSession();
                } else {
                    messageApi.error(resp.message || '注销失败，请稍后重试');
                }
            },
        });
    };

    // 点击文章卡片：直接在当前页打开详情预览，无需回「发现」页搜索
    const openPreview = async (article) => {
        const resp = await postRequest('/api/context/getList', {
            articleId: article.id,
            pageSize: 1000,
        });
        if (resp.code !== 0 || !resp.data) return;

        const list = (resp.data.list || []).map(item => {
            if (item.elementType?.includes('/') && item.content) {
                item.content = buildDefaultFileList(item.content);
            }
            item.name = +item.name;
            item.key = +item.id;
            return item;
        });

        // 没有正文时用封面兜底（和「发现」页保持一致）
        if (!list.length) {
            list[0] = { content: buildDefaultFileList(article.coverImage), name: 1, key: 1, id: 1 };
        }

        set_currentArticle(article);
        set_contextList(list);
        set_previewOpen(true);
    };

    // ============================================================
    // 未登录：登录 / 注册
    // ============================================================
    if (!loggedIn) {
        return (
            <div className='profile-page'>
                <div className='login-wrap'>
                    <div className='login-card'>
                        <span className='login-eyebrow'>DALANBEN · 大蓝本</span>
                        <h1>{mode === 'login' ? '欢迎回来' : '加入大蓝本'}</h1>
                        <p className='login-sub'>
                            {mode === 'login'
                                ? '用昵称和邮箱登录，继续阅读与互动。'
                                : '不需要密码，昵称和邮箱就是你的身份。'}
                        </p>

                        <Form form={form} layout='vertical' requiredMark={false} onFinish={handleSubmit}>
                            <Form.Item
                                name='nickName'
                                label='昵称'
                                rules={[
                                    { required: true, message: '请输入昵称' },
                                    { min: 6, max: 10, message: '长度在 6-10 个字符' },
                                ]}
                            >
                                <Input size='large' placeholder='6-10 个字符' allowClear />
                            </Form.Item>

                            <Form.Item
                                name='email'
                                label='邮箱'
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '邮箱格式不正确' },
                                ]}
                            >
                                <Input size='large' placeholder='you@example.com' allowClear />
                            </Form.Item>

                            <Form.Item
                                name='code'
                                label='验证码'
                                rules={[{ required: true, message: '请输入验证码' }]}
                            >
                                <Input
                                    size='large'
                                    prefix={<SignatureOutlined />}
                                    placeholder='输入验证码'
                                    allowClear
                                    addonAfter={
                                        SVG?.svg
                                            ? <span
                                                className='captcha-img'
                                                title='点击刷新验证码'
                                                onClick={refreshCaptcha}
                                                dangerouslySetInnerHTML={{ __html: SVG.svg }}
                                            />
                                            : <a className='captcha-get' onClick={getCaptchaCode}>获取</a>
                                    }
                                />
                            </Form.Item>

                            <Button
                                type='primary'
                                size='large'
                                htmlType='submit'
                                block
                                loading={submitLoading}
                                className='login-submit'
                            >
                                {mode === 'login' ? '登录' : '注册并登录'}
                            </Button>
                        </Form>

                        <div className='login-switch'>
                            {mode === 'login'
                                ? <>还没有账号？<a onClick={() => set_mode('register')}>去注册</a></>
                                : <>已有账号？<a onClick={() => set_mode('login')}>去登录</a></>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // 已登录：小红书风格的个人主页
    // ============================================================
    const ua = parseUA(TouristsAuth?.navigator || '');
    const avatarSrc = TouristsAuth?.avatar ? FILE_BASEURI + TouristsAuth.avatar : null;
    const initials = (TouristsAuth?.nickName || '游')[0];

    const stats = [
        { label: '关注', value: countIds(TouristsAuth?.focus) },
        { label: '获赞', value: countIds(TouristsAuth?.likeStrings) },
        { label: '收藏', value: countIds(TouristsAuth?.collects) },
        { label: '浏览', value: countIds(TouristsAuth?.viewStrings) },
        { label: '评论获赞', value: countIds(TouristsAuth?.commentLikeStrings) },
    ];

    const currentTab = TABS.find(t => t.key === tab) || TABS[0];

    return (
        <div className='profile-page'>
            <div className='profile-inner'>

                <section className='profile-card'>
                    <div className='profile-avatar'>
                        <Avatar size={112} src={avatarSrc}>{!avatarSrc && initials}</Avatar>
                    </div>

                    <div className='profile-main'>
                        <div className='profile-name-row'>
                            <h1>{TouristsAuth?.nickName || '游客'}</h1>
                            {TouristsAuth?.isSystem && <Tag bordered={false} color='blue'>系统账号</Tag>}
                            {TouristsAuth?.isBanned && <Tag bordered={false} color='red'>已禁言</Tag>}
                        </div>

                        <p className='profile-id'>大蓝本号：{TouristsAuth?.id}</p>
                        <p className='profile-email'>{TouristsAuth?.email || '未填写邮箱'}</p>

                        <div className='profile-tags'>
                            {TouristsAuth?.createdAt && (
                                <span><CalendarOutlined /> {formatDate(TouristsAuth.createdAt, 'YYYY-MM-DD')} 加入</span>
                            )}
                            <span><DesktopOutlined /> {ua.os} · {ua.browser}</span>
                            <span><EnvironmentOutlined /> {TouristsAuth?.ClientIp || '未知'}</span>
                        </div>

                        <div className='profile-stats'>
                            {stats.map(s => (
                                <div key={s.label}>
                                    <strong>{s.value}</strong>
                                    <span>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='profile-actions'>
                        <Button className='profile-logout' icon={<LogoutOutlined />} onClick={loginOut}>
                            退出登录
                        </Button>
                        <Button danger icon={<DeleteOutlined />} onClick={destroyAccount}>
                            注销账号
                        </Button>
                    </div>
                </section>

                <section className='profile-content'>
                    <div className='profile-tabs'>
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                type='button'
                                className={tab === t.key ? 'active' : ''}
                                onClick={() => set_tab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className='profile-body'>
                        {articlesLoading ? (
                            <div className='profile-loading'><Spin /></div>
                        ) : articles.length ? (
                            <div className='article-grid'>
                                {articles.map(a => (
                                    <div
                                        className='article-item'
                                        key={a.id}
                                        onClick={() => openPreview(a)}
                                    >
                                        <div className='article-cover'>
                                            <img
                                                src={a.coverImage ? FILE_BASEURI + a.coverImage : imgError}
                                                alt={a.title}
                                                onError={e => { e.target.src = imgError; }}
                                            />
                                        </div>
                                        <div className='article-info'>
                                            <p className='article-title'>{a.title}</p>
                                            <div className='article-meta'>
                                                <span>{a.User?.name_display || a.User?.name || '大蓝本'}</span>
                                                <span className='article-stats'>
                                                    <span><HeartOutlined /> {a.likes || 0}</span>
                                                    <span><StarOutlined /> {a.collects || 0}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description={currentTab.empty} />
                        )}
                    </div>
                </section>

                {/* 文章详情预览：直接在个人页打开，不再跳回「发现」 */}
                <Modal
                    open={previewOpen}
                    onCancel={() => set_previewOpen(false)}
                    footer={null}
                    width='68%'
                    centered
                    destroyOnHidden
                >
                    <div style={{ height: '80vh' }}>
                        <ArticlePreviewComp listHeight={600} Params={currentArticle} contextList={contextList} />
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Profile;
