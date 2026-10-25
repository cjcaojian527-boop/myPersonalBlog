import React, { useState, useEffect, useRef } from 'react';
import {
    EyeOutlined, ReadOutlined, HeartOutlined, HeartFilled,
    UserOutlined, ClearOutlined, StarFilled,
    CloseOutlined, StarOutlined, MessageOutlined, LinkOutlined,
    SunOutlined, MoonOutlined
} from '@ant-design/icons';

import DrawerComp from '@views/antd/Drawer';
import { WordCloud } from "@isoterik/react-word-cloud";
import TagCloud from 'TagCloud';
import { App, Modal, Avatar, Space, ConfigProvider, theme as antdTheme } from 'antd';
import { FILE_BASEURI } from '@utils/const';
import { useNavigate, useLocation, Outlet } from "react-router";
import { postRequest, getRequest } from '@utils/api';
import { useNav } from '@/store';
import { deepClone, buildDefaultFileList, copyToClipboard, getCommentTrees } from '@utils/utils';
import ArticlePreviewComp from '@views/articlePreview';

import CommentList from '@views/antd/CommentList';
import { useAuthStore, useThemeStore } from '@/store';
import frontLogo from '@assets/frontLogo.png';
import searchIcon from '@assets/search-icon.svg';
import searchIconShow from '@assets/search-icon-show.svg';
import '../admin/scss/frontHome';




const TagCloudSphere = ({ tags, TagsClick }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const tagCloud = TagCloud(
            containerRef.current,
            tags.current.map(t => t.labelName),   // 只要标签名数组
            {
                itemClass: 'my-tag',             // 自定义 class
                // useItemInlineStyles: false,
                radius: 120,              // 球半径（越大字越散）
                maxSpeed: 'fast',       // 最大转速：slow / normal / fast
                initSpeed: 'normal',      // 初始转速
                direction: 135,           // 旋转方向角，默认 135
                keep: false,               // 鼠标移出后继续转（关键！一直转就靠它）
            }
        );

        return () => tagCloud.destroy();  // 卸载时销毁，防内存泄漏
    }, [tags.current]);

    return <div className='WordCloud' onClick={TagsClick} ref={containerRef} />;
};

// 高亮标题里命中的关键字（大小写不敏感，转义正则特殊字符防报错）
const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;
    const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${safe})`, 'gi'));
    return parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase()
            ? <span key={i} className="highlight">{part}</span>
            : part
    );
};




// 历史搜索记录在 localStorage 里的 key
const SEARCH_HISTORY_KEY = 'search_history';


const Home = () => {

    const [items, setItems] = useState([]);
    // const userList = useRef([]);
    const typesRespList = useRef([]);                       // 给 getList 异步查找用（render 外读合法）
    const [articleTypes, set_articleTypes] = useState([]);  // 文章类型列表，给 render 渲染 tab 用
    const Tags = useRef([]);
    const sentinelRef = useRef(null);
    const total = useRef(0);
    const [contextList, SetcontextList] = useState([]);
    const [searchInput, set_searchInput] = useState('');

    // ===== 搜索下拉面板相关状态 =====
    const [searchFocus, set_searchFocus] = useState(false);   // 是否聚焦（控制面板展开/收起）
    const [suggestList, set_suggestList] = useState([]);      // 模糊搜索联想结果
    const [currentTypeId, set_currentTypeId] = useState('-1');
    const suggestTimer = useRef(null);

    // 历史记录：从 localStorage 惰性初始化（首次渲染读一次）
    const [historyList, set_historyList] = useState(() => {
        try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; }
        catch { return []; }
    });
    const [DrawerData, set_DrawerData] = useState({});
    const [currentArticle, set_currentArticle] = useState({});
    const [webSiteInfo, set_webSiteInfo] = useState({});
    const page = useRef(1);
    const [loding, set_loding] = useState(false);
    const [loadingTop, set_loadingTop] = useState(false);
    const { message: messageApi } = App.useApp();

    // ===== 主题（亮色/暗色，只作用于前台）=====
    const currentTheme = useThemeStore(state => state.theme);
    const toggleTheme = useThemeStore(state => state.toggleTheme);
    const isDark = currentTheme === 'dark';
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ===== 游客登录/注册弹窗 =====



    const TouristsAuth = useAuthStore(state => state.TouristsAuth);
    const TouristsToken = useAuthStore(state => state.TouristsToken);
    const auth = useAuthStore(state => state.auth);

    const navigate = useNavigate();
    const location = useLocation();
    // 去掉尾部斜杠后用于侧边栏激活态判断（/home、/home/blue、/home/profile）
    const currentPath = location.pathname.replace(/\/+$/, '') || '/home';

    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };



    const getList = async (queryData = {}, callback = () => { }) => {

        const params = { pageSize: 20, pageNum: page.current, ...queryData };

        // const formData = {};
        if (params.formData?.articleType === '1' || params.formData?.articleType === '-1') {
            delete params.formData.articleType;
        }
        if (params.formData?.title == '') {
            delete params.formData.title;
        }
        const isObserver = params.isObserver;
        if (isObserver) {
            delete params.isObserver;
        }
        // console.log('params:', params);
        const resp = await postRequest("/api/artcle/getList", params);
        callback();
        set_loding(false);
        console.log('searchData查询结果：', resp);

        if (resp.code == 0 && resp.data) {
            total.current = resp.data.total;
            if (resp.data.list.length) {
                page.current = params.pageNum;
            }

            const _display = ['userId', 'articleType'];

            // console.log(resp.data.list);
            if (resp.data.list.length) {
                resp.data.list = resp.data.list.map(obj => {
                    obj.key = obj.id;
                    obj.TagName = params?.formData?.labelId ? obj.Labels[0].labelName : undefined;
                    // obj.userData = lists.find(u => u.id === obj.userId) || {};
                    // obj[_display[0] + '_display'] = obj.userData.name_display;
                    obj[_display[1] + '_display'] = typesRespList.current.find(f => f.typeId === obj.articleType)?.typeName || '';

                    return obj;
                });
                setItems(prev => {
                    const unique = [...new Map([...prev, ...resp.data.list].map(item => [item.id, item])).values()];
                    return unique.sort((a, b) => Number(b.isTop) - Number(a.isTop));
                });
            } else {
                if (isObserver) {
                    messageApi.open({ type: 'warning', content: '没有更多文章了~' });
                }

            }

        }
    }


    const reloadList = () => {

        const root = document.getElementById('scrollable-container');
        root.scrollTo({ top: 0, behavior: 'smooth' });
        page.current = -1;
        set_currentTypeId('-1');
        set_loadingTop(true);
        setTimeout(() => getList({ pageNum: 1 }, () => {
            set_searchInput('');
            setItems([]);
            set_loadingTop(false);
        }), 1000);

    }


    const getNextArticle = (type) => {

        const { id } = currentArticle;

        const index = items.findIndex(f => f.id === id);

        // console.log(index, items[index + 1], items[index - 1])

        if (index == -1) {
            return <span>随便看看</span>;
        }

        const ev = { target: { className: 'fengmian' } };


        if (type == 1) {
            if (!items[index + 1]) {
                return null;
            }

            return <>下一篇: <span onClick={() => itemClick(ev, items[index + 1])} title={items[index + 1]?.title}>{items[index + 1]?.title}</span></>

        } else {
            if (!items[index - 1]) {
                return null;
            }
            return <>上一篇: <span onClick={() => itemClick(ev, items[index - 1])} title={items[index - 1]?.title}>{items[index - 1]?.title}</span></>
        }

    }


    const itemClick = async ({ target }, props) => {
        // console.dir(target);
        console.log(props);

        if (target.className === 'fengmian') {
            SetcontextList([]);
            set_currentArticle({});
            const resp = await postRequest("/api/context/getList", { articleId: props.id, pageSize: 1000 });
            console.log('searchData查询结果：', resp);
            if (resp.code == 0 && resp.data) {
                set_currentArticle(props);
                resp.data.list = resp.data.list.map(item => {
                    if (item.elementType?.includes('/') && item.content) {
                        const file = buildDefaultFileList(item.content);
                        item.content = file;
                    }
                    item.name = +item.name;
                    item.key = +item.id;
                    return item;

                });
                if (resp.data.list.length == 0) {
                    const file = buildDefaultFileList(props.coverImage);
                    resp.data.list[0] = {
                        content: file,
                        name: 1,
                        key: 1,
                        id: 1,

                    }
                }
                console.log("resp.data.list:", resp.data.list)
                setIsModalOpen(true);
                SetcontextList(resp.data.list);

            }

        }
    }

    const TagsClick = (ev) => {
        // console.dir(ev.target);
        const root = document.getElementById('scrollable-container');
        if (ev.target.tagName === 'SPAN') {
            // console.log(Tags);
            const label = Tags.current.find(f => f.labelName === ev.target.textContent);
            console.log('当前标签云:', label);
            if (label) {

                root.scrollTo({ top: 0, behavior: 'smooth' });
                page.current = -1;
                set_loadingTop(true);
                setTimeout(() => getList({ pageNum: 1, formData: { labelId: [label.labelId], title: searchInput, articleType: currentTypeId } }, () => {
                    // set_searchInput('');
                    setItems([]);
                    set_loadingTop(false);
                }), 1000);
            }
        }

    }


    const queryUsers = async (body = {}) => {
        const usersResp = await postRequest("/api/touristsAuth/queryUsers", { formData: { id: TouristsAuth.id, ...body }, pageSize: 100 });
        if (usersResp.code == 0 && usersResp.data?.list?.length) {
            return usersResp.data.list;
        }
        return [];
    }



    const collectClick = async (props) => {
        let isNull;
        if (!props) {
            props = currentArticle;
            isNull = true;
        }
        const isHeartFilled = TouristsAuth.collects?.split(',').includes(props.id + '');

        if (!TouristsToken) {
            // 未登录：直接去个人页登录
            navigate('/home/profile');
        } else {

            const body = { id: TouristsAuth.id, collects: [...TouristsAuth.collects.split(',')] }
            if (!isHeartFilled) {
                body.collects.push(props.id);
            } else {
                body.collects = body.collects.filter(f => f !== props.id + '');

            }
            body.collects = body.collects.join(',');

            const resp = await postRequest("/api/touristsAuth/updateUser", body);
            // messageApi.open({ type: resp.code == 0 ? 'success' : 'error', content: resp.message });
            if (resp.code == 0) {
                const { setVale } = useAuthStore.getState();
                const newLikes = isHeartFilled ? (props.collects || 0) - 1 : (props.collects || 0) + 1;

                await postRequest("/api/artcle/update", { id: props.id, collects: newLikes });
                setVale('TouristsAuth', resp.data);
                if (isNull) {
                    set_currentArticle(prev => {
                        return { ...prev, collects: newLikes }
                    });
                }


                setItems(prev => prev.map(item =>
                    item.id === props.id ? { ...item, collects: newLikes } : item
                ));


            }
        }

    }




    const openCommentList = async () => {
        // set_DrawerData();
        console.log('打开文章：', currentArticle);

        if (!TouristsToken) {
            // 未登录：直接去个人页登录
            navigate('/home/profile');
            return;
        }

        const users = await queryUsers();
        if (users.length) {
            const { setVale } = useAuthStore.getState();
            setVale('TouristsAuth', users[0]);
        }

        const resp = await postRequest("/api/comment/getComment", { formData: { articleId: currentArticle.id }, pageSize: 1000 });
        // console.log('查询结果：', resp);
        if (resp.code == 0 && resp.data?.list?.length) {
            const [Pnodes, nodeMap, commentCount] = getCommentTrees(resp.data.list.filter(f => f.Commentobject == -1), resp.data.list.filter(f => f.Commentobject !== -1), TouristsAuth);
            // console.log(Pnodes)
            const itme = {
                open: true,
                onClose: DrawerClear,
                title: <h3 style={{ color: 'var(--color-primary-label)' }}>{`共 ${commentCount} 条评论`}</h3>,
                children: <CommentList comments={Pnodes} Count={commentCount} nodeMap={nodeMap} currentArticle={currentArticle} />
            };
            set_DrawerData(itme);
        } else {
            const itme = {
                open: true,
                onClose: DrawerClear,
                title: <h3 style={{ color: 'var(--color-primary-label)' }}>欢迎留言评论😁</h3>,
                children: <CommentList currentArticle={currentArticle} />
            };
            set_DrawerData(itme);
        }

    }





    const likeClick = async (props) => {
        console.log(props);
        let isNull;

        if (!props) {
            props = currentArticle;
            isNull = true;
        }


        const isHeartFilled = TouristsAuth.likeStrings?.split(',').includes(props.id + '');

        if (!TouristsToken) {
            // 未登录：直接去个人页登录
            navigate('/home/profile');
        } else {

            const body = { id: TouristsAuth.id, likeStrings: [...TouristsAuth.likeStrings.split(',')] }
            if (!isHeartFilled) {
                body.likeStrings.push(props.id);
            } else {
                body.likeStrings = body.likeStrings.filter(f => f !== props.id + '');

            }
            body.likeStrings = body.likeStrings.join(',');

            const resp = await postRequest("/api/touristsAuth/updateUser", body);
            // messageApi.open({ type: resp.code == 0 ? 'success' : 'error', content: resp.message });
            if (resp.code == 0) {
                const { setVale } = useAuthStore.getState();
                const newLikes = isHeartFilled ? (props.likes || 0) - 1 : (props.likes || 0) + 1;

                await postRequest("/api/artcle/update", { id: props.id, likes: newLikes });
                setVale('TouristsAuth', resp.data);
                if (isNull) {
                    set_currentArticle(prev => {
                        return { ...prev, likes: newLikes }
                    });
                }


                setItems(prev => prev.map(item =>
                    item.id === props.id ? { ...item, likes: newLikes } : item
                ));


            }
        }



    }

    // ===== 分享链接：复制带文章 id 的 URL 到剪贴板 =====
    const shareLink = async () => {
        const url = `${window.location.origin}${window.location.pathname}?articleId=${currentArticle.id}`;
        const ok = await copyToClipboard(url);
        messageApi.open({ type: ok ? 'success' : 'error', content: ok ? '链接已复制到剪贴板' : '复制失败，请手动复制' });
    };

    // 根据 URL 里的 articleId 自动打开文章（分享链接直达）
    const openArticleById = async (articleId) => {
        const resp = await postRequest("/api/artcle/getList", { pageSize: 1, formData: { idStrings: articleId } });
        if (resp.code == 0 && resp.data?.list?.length) {
            const ev = { target: { className: 'fengmian' } };
            itemClick(ev, resp.data.list[0]);
        }
    };

    // 启动时解析 URL 的 articleId，自动打开对应文章
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('articleId');
        if (articleId) {
            openArticleById(articleId);
            // 打开后清掉 articleId 参数（replaceState 不新增历史记录，后退不会回到带参数的地址）
            params.delete('articleId');
            const query = params.toString();
            window.history.replaceState(null, '', `${window.location.pathname}${query ? '?' + query : ''}`);
        }
    }, []);

    // 模糊搜索联想：真正发请求的地方（独立写，避免复用 getList 污染瀑布流）
    const fetchSuggest = async (keyword) => {
        // TODO: 后端支持 title 模糊匹配后再用；这里先按 title 传参占位
        const resp = await postRequest("/api/artcle/getList", { pageSize: 10, formData: { title: keyword } });
        if (resp.code == 0 && resp.data) {
            set_suggestList(resp.data.list || []);
        }
    };

    // 防抖：输入停止 300ms 后才发联想请求
    const getSuggest = (keyword) => {
        clearTimeout(suggestTimer.current);
        if (!keyword.trim()) { set_suggestList([]); return; }   // 空关键字直接清空
        suggestTimer.current = setTimeout(() => fetchSuggest(keyword), 300);
    };

    const searchChange = (e) => {
        const val = e.target.value;
        set_searchInput(val);
        getSuggest(val);   // 输入即触发联想
    };

    // 提交搜索（回车 / 点图标 / 点历史或联想项）
    const searchSubmit = (keyword) => {

        const kw = (keyword ?? searchInput).trim();
        if (!kw) return;
        // 写入历史：去重 + 最新在前 + 最多 10 条，并持久化
        set_historyList(prev => {
            const next = [kw, ...prev.filter(h => h !== kw)].slice(0, 10);
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
            return next;
        });
        set_searchFocus(false);   // 收起面板
        // TODO: 在这里接真实搜索（比如 getList 带 title 条件刷新瀑布流）
        const root = document.getElementById('scrollable-container');
        root.scrollTo({ top: 0, behavior: 'smooth' });
        page.current = -1;
        set_loadingTop(true);
        setTimeout(() => getList({ pageNum: 1, formData: { title: kw } }, () => {
            setItems([]);
            set_loadingTop(false);
        }), 1000);
    };

    // 点联想项 / 历史项：回填关键字并提交
    const pickKeyword = (kw) => {
        set_searchInput(kw);
        searchSubmit(kw);
    };

    // 清空历史
    const clearHistory = () => {
        set_historyList([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    };

    const DrawerClear = () => {
        set_DrawerData(state => ({ ...state, title: '', open: false }));
    }

    const switchArticleType = ({ typeId, typeName }) => {
        if (typeId === '1') {

            console.log(articleTypes.slice(15, articleTypes.length));

        } else {
            set_searchInput('');
            set_currentTypeId(typeId);
            page.current = -1;
            set_loadingTop(true);
            setTimeout(() => getList({ pageNum: 1, formData: typeId == -1 ? {} : { articleType: typeId } }, () => {
                setItems([]);
                set_loadingTop(false);
            }), 1000);
        }

    }


    // 侧边栏切换：发现 / BLUE / 个人 各自对应前台子路由
    const sideBarClick = (type) => {
        if (type === 1) navigate('/home');
        else if (type === 2) navigate('/home/blue');
        else if (type === 3) navigate('/home/profile');
    }

    const TouristsloginOut = () => {
        const { setVale, setToken } = useAuthStore.getState();
        setVale('TouristsAuth', {});
        setVale('TouristsToken', '');

        setVale('auth', {});
        setToken('');
    }



    useEffect(() => {
        useNav.getState().setNavigate(navigate);
    }, [navigate]);

    // 把主题写到 <html data-theme> 上，前台卸载时移除
    // —— 只进后台时此 effect 从不执行，后台因此保持原样
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        return () => root.removeAttribute('data-theme');
    }, [isDark]);

    useEffect(() => {


        console.log("TouristsAuth:", TouristsAuth);
        console.log("auth:", auth);
        const requestList = [
            getRequest("/api/articleType/getList", {}),
            postRequest("/api/labels/getLabels", { formData: {}, pageSize: 100 }),
            getRequest("/api/stats/getSiteStats", {}),
        ];
        //查询游客
        if (TouristsAuth?.id) {
            queryUsers().then(list => {
                if (list.length == 0) {
                    TouristsloginOut();
                }
            });
        }

        Promise.all(requestList).then(([typesResp, labelResp, siteResp]) => {
            getList({});

            if (typesResp.code == 0 && typesResp.data?.length) {
                typesResp.data = [{ typeId: '-1', typeName: '推荐' }, ...typesResp.data]
                typesRespList.current = typesResp.data;   // ref 保持最新，给 getList 查找用
                set_articleTypes(typesResp.data);         // state 触发重渲染，render 里的 tab 才能显示
            }
            if (labelResp.code == 0 && labelResp.data?.list?.length) {
                Tags.current = labelResp.data.list;
            }
            if (siteResp.code == 0 && siteResp.data) {
                set_webSiteInfo(siteResp.data);
            }

        });


    }, []);






    useEffect(() => {
        const el = sentinelRef.current;
        const root = document.getElementById('scrollable-container');
        if (!el || !root) return;

        let observer = null;
        const _timer = setTimeout(() => {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && page.current !== -1) {
                        set_loding(true);

                        const formData = { title: searchInput };
                        if (currentTypeId !== '-1' && currentTypeId !== '1') {
                            formData.articleType = currentTypeId;
                        }
                        setTimeout(() => getList({ pageNum: page.current + 1, isObserver: true, formData }), 1000);
                    }
                },
                { root, rootMargin: '10px' }
            );
            observer.observe(el);
        }, 1000);
        return () => {
            observer?.disconnect();
            clearTimeout(_timer);
        }
    }, [currentTypeId, location.pathname]);

    return (<ConfigProvider
        theme={{ algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}
    >
        <div className='container_Home'>
            <div className='header-container'>
                <header className='mask-paper'>
                    <a aria-current="page" href="/" className="active router-link-exact-active" id="link-guide" style={{ display: 'flex' }}>
                        <img crossOrigin="anonymous" className="header-logo" style={{ pointerEvents: 'none' }} src={frontLogo} alt="logo" />
                    </a>
                    {currentPath === '/home' && <div className="input-box">
                        <input
                            id="search-input"
                            type="text"
                            spellCheck="false"
                            className="search-input"
                            placeholder="输入标题关键字搜索文章"
                            autoComplete="off"
                            value={searchInput}
                            onFocus={() => set_searchFocus(true)}                 // 聚焦 → 展开
                            onBlur={() => set_searchFocus(false)}                 // 失焦 → 收起
                            onChange={searchChange}
                            onKeyDown={e => e.key === 'Enter' && searchSubmit()}  // 回车提交
                        />
                        <div className="input-button">
                            {!searchInput && <ClearOutlined title='重置' onClick={reloadList} style={{ fontSize: 18, cursor: 'pointer', marginRight: 10 }} />}
                            {searchInput?.trim().length > 0 && <CloseOutlined onClick={() => set_searchInput('')} style={{ fontSize: 18, cursor: 'pointer', marginRight: 10 }} />}
                            <div className="search-icon" style={{ cursor: searchInput.length > 0 ? 'pointer' : 'no-drop' }} onClick={() => searchSubmit()}>
                                <img className="standard-search-icon" src={searchInput.length > 0 ? searchIconShow : searchIcon} alt="搜索" />
                            </div>
                        </div>

                        {/* ===== 搜索下拉面板：聚焦展开，含「联想结果」+「历史记录」两个区域 ===== */}
                        <div className={`search-panel ${searchFocus ? 'show' : ''}`}>

                            {/* 区域一：模糊搜索联想（有关键字且有结果才显示） */}
                            {searchInput.trim() && suggestList.length > 0 && (
                                <div className="search-section">
                                    <div className="section-title">搜索 “{searchInput}”</div>
                                    <ul className="suggest-list">
                                        {suggestList.map(item => (

                                            <li key={item.id} onMouseDown={e => { e.preventDefault(); pickKeyword(item.title); }}>
                                                {highlightKeyword(item.title, searchInput)}
                                            </li>

                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 区域二：历史搜索记录（有历史才显示） */}
                            {historyList.length > 0 && (
                                <div className="search-section">
                                    <div className="section-title">
                                        历史搜索
                                        <span className="clear-history" onMouseDown={e => { e.preventDefault(); clearHistory(); }}>清空</span>
                                    </div>
                                    <ul className="history-list">
                                        {historyList.map((kw, i) => (
                                            <li key={i} onMouseDown={e => { e.preventDefault(); pickKeyword(kw); }}>{kw}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 空态：无联想也无历史 */}
                            {!searchInput.trim() && historyList.length === 0 && (
                                <div className="search-empty">暂无搜索记录</div>
                            )}
                        </div>
                    </div>}

                    <div className="right">
                        {/* 主题切换：亮色 ↔ 暗色（只影响前台） */}
                        <div
                            className='theme-toggle'
                            onClick={toggleTheme}
                            title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
                        >
                            {isDark ? <SunOutlined /> : <MoonOutlined />}
                        </div>
                    </div>
                </header>

            </div>

            <div className='main-container'>
                <div className='side-bar'>
                    <div className={`side-bar-item${currentPath === '/home' ? ' active' : ''}`} onClick={() => sideBarClick(1)}><EyeOutlined /><span>发现</span></div>
                    <div className={`side-bar-item${currentPath === '/home/blue' ? ' active' : ''}`} onClick={() => sideBarClick(2)}><ReadOutlined /><span>BLUE</span></div>
                    <div className={`side-bar-item${currentPath === '/home/profile' ? ' active' : ''}`} onClick={() => sideBarClick(3)}>
                        {TouristsAuth?.avatar ? <Avatar style={{ marginLeft: 7 }} size={32} src={FILE_BASEURI + TouristsAuth.avatar} /> : <UserOutlined />}
                        <span>{TouristsToken ? TouristsAuth.nickName : '游客'}</span>
                    </div>
                    {/* <div className='side-bar-item'><EyeOutlined /><span>发现4</span></div> */}
                    <div className='websiteinfo'>
                        <div className='info-item'>
                            <span>文章总数:</span><span>{total.current}</span>
                        </div>
                        <div className='info-item'>
                            <span>访问总数:</span><span>{webSiteInfo.totalVisits || 0}</span>
                        </div>
                        <div className='info-item'>
                            <span>总访客数:</span><span>{webSiteInfo.totalVisitors || '获取失败'}</span>
                        </div>
                        <div className='info-item'>
                            <span>建站天数:</span><span>{webSiteInfo.daysSinceCreation || '获取失败'}</span>
                        </div>
                        <div className='info-item'>
                            <span>最后更新:</span><span>{webSiteInfo.lastUpdateText || '获取失败'}</span>
                        </div>
                    </div>
                    {/* 标签云只服务于「发现」页的文章筛选 */}
                    {currentPath === '/home' && <TagCloudSphere tags={Tags} TagsClick={TagsClick} />}


                </div>
                {/* 内容区：发现 / BLUE / 个人 由子路由决定，布局与状态保留在 Home */}
                <Outlet
                    context={{
                        items,
                        articleTypes,
                        currentTypeId,
                        loadingTop,
                        loding,
                        sentinelRef,
                        onSwitchType: switchArticleType,
                        onItemClick: itemClick,
                        onLikeClick: likeClick,
                        onReload: reloadList,
                        webSiteInfo,
                        articleTotal: total.current,
                    }}
                />
                <Modal
                    title=""

                    closable={false}
                    width="68%"
                    centered
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    footer={<div className='flex_BOX'>
                        <div className='left'>{getNextArticle(-1)}</div>
                        <Space size='small'>

                            {TouristsAuth.likeStrings?.split(',').includes(currentArticle.id + '') ? <HeartFilled onClick={() => likeClick()} style={{ color: 'var(--color-red)' }} /> : <HeartOutlined onClick={() => likeClick()} />}
                            <span className='textSpan'>{currentArticle.likes || 0}</span>
                            {TouristsAuth.collects?.split(',').includes(currentArticle.id + '') ? <StarFilled onClick={() => collectClick()} style={{ color: '#ffef0c' }} /> : <StarOutlined onClick={() => collectClick()} />}

                            <span className='textSpan'>{currentArticle.collects || 0}</span>
                            <MessageOutlined onClick={openCommentList} />
                            {/* <span className='textSpan'>0</span> */}
                            <LinkOutlined title='分享文章链接' onClick={shareLink} />
                        </Space>
                        <div className='right'>{getNextArticle(1)}</div></div>}
                >
                    <div style={{ height: '80vh' }}>
                        <ArticlePreviewComp listHeight={600} Params={currentArticle} contextList={contextList}></ArticlePreviewComp>
                    </div>
                </Modal>

            </div>
            <DrawerComp {...DrawerData}></DrawerComp>

        </div>
    </ConfigProvider>)
};


export default Home;