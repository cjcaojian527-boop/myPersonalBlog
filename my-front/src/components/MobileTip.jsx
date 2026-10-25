import React, { useState } from 'react';
import { useThemeStore } from '@/store';

const SITE = 'dalanben.live/blog';

// 移动端访问提示页。
// 由 main.jsx 在最外层拦截后渲染 —— 此时路由尚未初始化、首页尚未挂载，
// 因此不会发起菜单、文章列表等任何接口请求。
const MobileTip = () => {
    const theme = useThemeStore(state => state.theme);
    const [copied, set_copied] = useState(false);

    // 复制站点地址（剪贴板不可用时静默失败，用户仍可手动长按复制）
    const copySite = async () => {
        try {
            await navigator.clipboard.writeText(`https://${SITE}`);
            set_copied(true);
            setTimeout(() => set_copied(false), 2000);
        } catch {
            /* 忽略 */
        }
    };

    return (
        <div className={`mobile-tip${theme === 'dark' ? ' is-dark' : ''}`}>
            <style>{`
                .mobile-tip {
                    --tip-bg: #f7f7f5;
                    --tip-card: rgba(255, 255, 255, 0.72);
                    --tip-border: rgba(11, 11, 11, 0.08);
                    --tip-title: #0b0b0b;
                    --tip-text: #52514e;
                    --tip-muted: #898781;
                    --tip-accent: #2a78d6;
                    --tip-accent-soft: rgba(42, 120, 214, 0.07);
                    --tip-accent-border: rgba(42, 120, 214, 0.16);
                    --tip-glow: rgba(42, 120, 214, 0.16);
                    --tip-shadow: 0 24px 80px rgba(11, 11, 11, 0.08);

                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    box-sizing: border-box;
                    overflow: hidden;
                    background: var(--tip-bg);
                    font-family: system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
                    color: var(--tip-title);
                    -webkit-font-smoothing: antialiased;
                }

                .mobile-tip.is-dark {
                    --tip-bg: #101114;
                    --tip-card: rgba(28, 29, 33, 0.72);
                    --tip-border: rgba(255, 255, 255, 0.09);
                    --tip-title: #f4f4f2;
                    --tip-text: #b8b7b2;
                    --tip-muted: #7d7c77;
                    --tip-accent: #6aa6f5;
                    --tip-accent-soft: rgba(106, 166, 245, 0.08);
                    --tip-accent-border: rgba(106, 166, 245, 0.2);
                    --tip-glow: rgba(60, 110, 200, 0.28);
                    --tip-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
                }

                .mobile-tip::before {
                    content: '';
                    position: absolute;
                    top: -220px;
                    left: 50%;
                    width: 520px;
                    height: 520px;
                    margin-left: -260px;
                    border-radius: 50%;
                    background: var(--tip-glow);
                    filter: blur(120px);
                    pointer-events: none;
                }

                .mobile-tip .tip-card {
                    position: relative;
                    width: 100%;
                    max-width: 420px;
                    padding: 42px 34px 30px;
                    box-sizing: border-box;
                    border-radius: 28px;
                    background: var(--tip-card);
                    border: 1px solid var(--tip-border);
                    box-shadow: var(--tip-shadow);
                    -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
                    animation: tip-in 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
                }

                @keyframes tip-in {
                    from { opacity: 0; transform: translateY(14px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }

                .mobile-tip .tip-brand {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.28em;
                    color: var(--tip-muted);
                    margin-bottom: 28px;
                }

                .mobile-tip .tip-brand em {
                    font-style: normal;
                    letter-spacing: 0.12em;
                    font-weight: 400;
                }

                .mobile-tip .tip-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--tip-accent);
                    flex: none;
                }

                .mobile-tip .tip-text {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.9;
                    color: var(--tip-text);
                }

                .mobile-tip .tip-lead {
                    margin: 18px 0 26px;
                    font-size: 15px;
                    font-weight: 550;
                    line-height: 1.7;
                    color: var(--tip-title);
                }

                .mobile-tip .tip-link {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 14px 16px;
                    box-sizing: border-box;
                    border-radius: 14px;
                    border: 1px solid var(--tip-accent-border);
                    background: var(--tip-accent-soft);
                    color: var(--tip-accent);
                    font: inherit;
                    cursor: pointer;
                    transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
                }

                .mobile-tip .tip-link:active {
                    transform: scale(0.985);
                    background: var(--tip-accent-border);
                }

                .mobile-tip .tip-url {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                    font-size: 14px;
                    letter-spacing: 0.02em;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .mobile-tip .tip-copy {
                    flex: none;
                    font-size: 12px;
                    font-weight: 600;
                    opacity: 0.85;
                }
            `}</style>

            <div className='tip-card'>
                <div className='tip-brand'>
                    <span className='tip-dot' />
                    <span>DALANBEN</span>
                    <em>大藍本</em>
                </div>

                {/* <h1 className='tip-title'>大蓝本提醒你</h1> */}

                <p className='tip-text'>
                    本网站暂未适配移动端
                </p>

                <p className='tip-lead'>请换一台电脑，再来看我。</p>

                <button className='tip-link' type='button' onClick={copySite}>
                    <span className='tip-url'>{SITE}</span>
                    <span className='tip-copy'>{copied ? '已复制' : '复制链接'}</span>
                </button>

                {/* <div className='tip-footer'>—— 大蓝本 · {new Date().getFullYear()}</div> */}
            </div>
        </div>
    );
};

export default MobileTip;
