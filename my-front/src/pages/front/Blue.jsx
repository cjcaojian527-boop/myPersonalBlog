import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { App } from 'antd';
import {
    AndroidFilled, AppleFilled, ArrowRightOutlined,
    ReadOutlined, MessageOutlined, MoonOutlined, ToolOutlined,
    ClockCircleOutlined, MailOutlined, CopyOutlined, GoogleOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import './scss/blue';

// ============================================================
// 页面文案与数据（后续可直接替换成老大的真实内容）
// ============================================================

const FEATURES = [
    {
        icon: <ReadOutlined />,
        title: '文章与分类',
        desc: '按类型、标签归档，支持置顶、搜索与瀑布流浏览。',
    },
    {
        icon: <MessageOutlined />,
        title: '互动',
        desc: '游客身份即可点赞、收藏、评论，无需注册账号。',
    },
    {
        icon: <MoonOutlined />,
        title: '阅读体验',
        desc: '暗色模式、沉浸式文章预览、封面懒加载。',
    },
    {
        icon: <ToolOutlined />,
        title: '后台管理',
        desc: '文章、类型、标签、评论、用户与图片统一管理。',
    },
];

const TECH_TAGS = ['React', 'Ant Design', 'Express', 'Sequelize', 'MinIO', 'Vite'];

// 联系方式：点击卡片即可复制邮箱
const CONTACTS = [
    {
        key: 'email',
        icon: <MailOutlined />,
        label: 'QQ 邮箱',
        value: '1024606864@qq.com',
    },
    {
        key: 'gmail',
        icon: <GoogleOutlined />,
        label: 'Gmail',
        value: 'cjcaojian527@gmail.com',
    },
];

// 下载地址；iOS 尚未提供，url 为空时展示「开发中」
const DOWNLOADS = [
    {
        key: 'android',
        icon: <AndroidFilled />,
        name: 'Android 版',
        sub: 'APK 安装包 · 108 MB',
        button: '下载 APK',
        url: 'https://dalanben.live/Preview/downloads/dalanben.apk',
    },
    {
        key: 'ios',
        icon: <AppleFilled />,
        name: 'iOS 版',
        sub: 'App Store · 敬请期待',
        button: '',
        url: '',
    },
];

// 个人项目示例，链接暂时留空，老大后续替换
const PROJECTS = [
    {
        icon: '📚',
        name: '大蓝本博客',
        desc: '你现在正在看的这个网站：文章、评论、点赞、后台管理一应俱全。',
        tags: ['React', 'Ant Design', 'Express', 'MinIO'],
        link: 'https://dalanben.live/blog',
    },
    {
        icon: '🖼️',
        name: '图片压缩工具',
        desc: '本地批量压缩与格式转换，处理完直接下载，不上传服务器。',
        tags: ['Canvas API', 'Web Worker'],
        link: '#',
    },
    {
        icon: '📝',
        name: 'Markdown 便签',
        desc: '轻量的 Markdown 编辑与预览，数据存在本地，打开就能写。',
        tags: ['React', 'IndexedDB'],
        link: '#',
    },
    {
        icon: '⌨️',
        name: 'CLI 效率脚本',
        desc: '一些日常小脚本：批量重命名、文件整理、开发环境初始化。',
        tags: ['Node.js', 'Shell'],
        link: '#',
    },
];

// ============================================================
// 页面
// ============================================================
const Blue = () => {
    const { webSiteInfo = {}, articleTotal = 0 } = useOutletContext() || {};
    const { message: messageApi } = App.useApp();

    // 邮箱点击复制
    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            messageApi.success('已复制到剪贴板');
        } catch {
            messageApi.error('复制失败，请手动复制');
        }
    };

    return (
        <div className='blue-page'>
            <div className='blue-inner'>

                {/* ===== 网站介绍 ===== */}
                <section className='blue-hero'>
                    <span className='hero-eyebrow'>DALANBEN · 大蓝本</span>
                    <h1>
                        把喜欢的东西，<br />
                        认真放在一起。
                    </h1>
                    <p className='hero-desc'>
                        大蓝本的个人博客 —— 写文章、记日常、放一些自己做的小工具。
                        从瀑布流、暗色模式，到评论互动和后台管理，都是亲手一点点搭起来的。
                    </p>
                    <div className='hero-stats'>
                        <div><strong>{articleTotal || '—'}</strong><span>篇文章</span></div>
                        <div><strong>{webSiteInfo.totalVisitors ?? '—'}</strong><span>位访客</span></div>
                        <div><strong>{webSiteInfo.daysSinceCreation ?? '—'}</strong><span>天建站</span></div>
                    </div>
                </section>

                <section className='blue-section'>
                    <div className='section-head'>
                        <h2>关于这个网站</h2>
                        <p>一个不赶时间、慢慢更新的个人角落。</p>
                    </div>
                    <div className='feature-grid'>
                        {FEATURES.map(f => (
                            <div className='feature-card' key={f.title}>
                                <div className='feature-icon'>{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className='tech-tags'>
                        {TECH_TAGS.map(t => <span key={t}>{t}</span>)}
                    </div>
                </section>

                {/* ===== 移动端下载 ===== */}
                <section className='blue-section'>
                    <div className='section-head'>
                        <h2>移动端下载</h2>
                        <p>Android 版已上线，iOS 版还在开发当中。</p>
                    </div>
                    <div className='download-grid'>
                        {DOWNLOADS.map(d => (
                            <div className='download-card' key={d.key}>
                                <div className='download-head'>
                                    <div className={`download-icon ${d.key}`}>{d.icon}</div>
                                    <div>
                                        <h3>{d.name}</h3>
                                        <p className='download-sub'>{d.sub}</p>
                                    </div>
                                </div>

                                {d.url ? (
                                    <div className='download-body'>
                                        <div className='qr-box'>
                                            <QRCodeSVG
                                                value={d.url}
                                                size={96}
                                                level='M'
                                                bgColor='#ffffff'
                                                fgColor='#111111'
                                            />
                                        </div>
                                        <div className='download-actions'>
                                            <span className='download-tip'>扫码下载</span>
                                            <a
                                                className='download-btn'
                                                href={d.url}
                                                target='_blank'
                                                rel='noreferrer'
                                            >
                                                {d.button}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='download-soon'>
                                        <ClockCircleOutlined />
                                        <span>还在开发当中</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== 个人项目 ===== */}
                <section className='blue-section'>
                    <div className='section-head'>
                        <h2>个人项目</h2>
                        <p>一些自己做的小工具和试验，持续整理中。</p>
                    </div>
                    <div className='project-grid'>
                        {PROJECTS.map(p => {
                            const isSoon = p.link === '#';
                            return (
                                <a
                                    className={`project-card${isSoon ? ' is-soon' : ''}`}
                                    key={p.name}
                                    href={p.link}
                                    target={isSoon ? undefined : '_blank'}
                                    rel={isSoon ? undefined : 'noreferrer'}
                                    onClick={isSoon ? e => e.preventDefault() : undefined}
                                >
                                    <div className='project-top'>
                                        <span className='project-icon'>{p.icon}</span>
                                        {!isSoon && <ArrowRightOutlined className='project-arrow' />}
                                    </div>
                                    <h3>{p.name}</h3>
                                    <p>{p.desc}</p>
                                    <div className='project-tags'>
                                        {p.tags.map(t => <span key={t}>{t}</span>)}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* ===== 联系我 ===== */}
                <section className='blue-section'>
                    <div className='section-head'>
                        <h2>联系我</h2>
                        <p>想到什么，随时找我聊聊。</p>
                    </div>
                    <div className='contact-grid'>
                        {CONTACTS.map(c => {
                            const inner = (
                                <>
                                    <div className='contact-icon'>{c.icon}</div>
                                    <div className='contact-main'>
                                        <span className='contact-label'>{c.label}</span>
                                        <span className='contact-value'>{c.value}</span>
                                    </div>
                                    {c.href
                                        ? <ArrowRightOutlined className='contact-arrow' />
                                        : <CopyOutlined className='contact-copy' />}
                                </>
                            );

                            return c.href ? (
                                <a
                                    key={c.key}
                                    className='contact-card'
                                    href={c.href}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {inner}
                                </a>
                            ) : (
                                <div
                                    key={c.key}
                                    className='contact-card'
                                    onClick={() => copyText(c.value)}
                                    title='点击复制'
                                >
                                    {inner}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <footer className='blue-footer'>—— 大蓝本 · {new Date().getFullYear()}</footer>
            </div>
        </div>
    );
};

export default Blue;
