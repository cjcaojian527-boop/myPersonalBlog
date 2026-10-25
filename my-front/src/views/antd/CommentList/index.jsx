import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Space, Avatar, Input, Button, App, Tag } from 'antd';
import { deepClone, formatCommentTime, getCommentTrees } from '@utils/utils';
import { useAuthStore } from '@/store';
import { postRequest, getRequest } from '@utils/api';
import { FILE_BASEURI } from '@utils/const';
import { HeartFilled, MessageOutlined, MoreOutlined, CaretRightOutlined, SmileOutlined, VerticalAlignTopOutlined, HeartOutlined, ReloadOutlined } from '@ant-design/icons';
import './index.scss';


const CommentList = ({ comments = [], nodeMap = new Map(), currentArticle = {}, Count = 0 }) => {
    const { message: messageApi } = App.useApp();
    const [inputValue, setInputValue] = useState('');
    const [focused, setFocused] = useState(false);
    const [currentComment, set_currentComment] = useState({});
    const textareaRef = useRef(null);
    const nodeMaps = useRef(nodeMap);
    const commentCount = useRef(Count);
    const scrollRef = useRef(null);
    const [commentsList, set_commentsList] = useState(comments);
    const likeThrottle = useRef(false); // 点赞节流
    const [showBackTop, setShowBackTop] = useState(false);

    // 监听滚动，超过 100px 显示回到顶部
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => setShowBackTop(el.scrollTop > 100);
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const TouristsAuth = useAuthStore(state => state.TouristsAuth);
    const auth = useAuthStore(state => state.auth);


    const handleSend = () => {
        if (!inputValue.trim()) return;
        console.log('发送评论:', inputValue);
        if (currentComment.Tourist?.isSystem && currentComment.Tourist?.email.includes('CloseAccount')) {
            messageApi.open({ type: 'error', content: '该账号已注销，回复评论失败！' });
            return;
        }
        if (currentComment.User?.isSystem && currentComment.User?.name.includes('CloseAccount')) {
            messageApi.open({ type: 'error', content: '该账号已注销，回复评论失败！' });
            return;
        }
        addComment(inputValue, deepClone(currentComment));
        setInputValue('');
        setFocused(false);
        set_currentComment({})
    };

    const handleCancel = () => {
        setInputValue('');
        setFocused(false);
        set_currentComment({});
    };

    const ToMessage = (item, childs) => {
        // console.log(item, childs);
        if ((!TouristsAuth.name && TouristsAuth.isBanned)) {
            return;
        }
        set_currentComment(childs || item);
        setFocused(true);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }

    }

    const addComment = async (context, commentTarget) => {
        const body = {
            articleId: currentArticle.id,
            uId: TouristsAuth.name ? TouristsAuth.id : undefined,
            tId: TouristsAuth.name ? undefined : TouristsAuth.id,
            isPass: TouristsAuth.name ? true : undefined,
            Commentobject: commentTarget.id,
            context
        }
        const resp = await postRequest("/api/comment/addComment", body);
        // console.log(resp);
        if (resp.code == 0) {
            reLoad(1);
        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }
    }

    const reLoad = async (flag) => {
        const resp = await postRequest("/api/comment/getComment", { formData: { articleId: currentArticle.id }, pageSize: 1000 });
        // console.log('查询结果：', resp);
        if (resp.code == 0 && resp.data?.list?.length) {
            if (flag === 1) messageApi.open({ type: 'success', content: '评论成功！' });
            const [Pnodes, _nodeMap, _commentCount] = getCommentTrees(resp.data.list.filter(f => f.Commentobject == -1), resp.data.list.filter(f => f.Commentobject !== -1), TouristsAuth);
            nodeMaps.current = _nodeMap;
            commentCount.current = _commentCount;
            set_commentsList(Pnodes);
        } else {
            messageApi.open({ type: 'error', content: '暂无评论！' });
        }
    }

    const editLikeStrings = (commentLikeStrings = TouristsAuth.commentLikeStrings) => {

        if (commentLikeStrings == undefined) return [];
        // console.log("commentLikeStrings:", commentLikeStrings);
        if (Object.prototype.toString.call(commentLikeStrings) === '[object Array]') {
            return commentLikeStrings.filter(f => f !== '' && f.trim().length > 0);
        }
        const list = commentLikeStrings.split(',').filter(f => f !== '' && f.trim().length > 0);
        return list;
    }

    const onLikeClick = async (item, childs) => {
        if (TouristsAuth.commentLikeStrings == undefined) {
            messageApi.open({ type: 'warning', content: '后台用户暂不支持点赞！' });
            return;
        }
        if (likeThrottle.current) {
            messageApi.open({ type: 'warning', content: '点击太快，请不要频繁点击！' });
            return;
        }
        likeThrottle.current = true;
        setTimeout(() => { likeThrottle.current = false; }, 1000);
        const props = deepClone(childs || item);
        console.log(props);
        if (props.Tourist?.isSystem && props.Tourist?.email.includes('CloseAccount')) {
            messageApi.open({ type: 'error', content: '该账号已注销，点赞失败！' });
            return;
        }
        if (props.User?.isSystem && props.User?.name.includes('CloseAccount')) {
            messageApi.open({ type: 'error', content: '该账号已注销，点赞失败！' });
            return;
        }

        const _uuid = TouristsAuth.id + '_' + currentArticle.id + '_' + props.id;

        const isHeartFilled = editLikeStrings(TouristsAuth.commentLikeStrings).includes(_uuid);
        const body = { id: TouristsAuth.id, commentLikeStrings: [...TouristsAuth.commentLikeStrings.split(',')] }
        if (!isHeartFilled) {
            body.commentLikeStrings.push(_uuid);
        } else {
            body.commentLikeStrings = editLikeStrings(body.commentLikeStrings).filter(f => f !== _uuid);

        }

        const { setVale } = useAuthStore.getState();

        const newLikes = isHeartFilled ? (props.likes || 0) - 1 : (props.likes || 0) + 1;
        //更新评论的likes  但是不能更新注销用户的点赞量
        const resp1 = await postRequest("/api/comment/updateComment", { id: props.id, likes: newLikes });
        // console.log('更新评论信息成功！');
        if (resp1.code !== 0) {
            messageApi.open({ type: 'error', content: resp1.message });
            return;
        }


        body.commentLikeStrings = body.commentLikeStrings.join(',');
        //更新自身的点赞评论list
        const resp2 = await postRequest("/api/touristsAuth/updateUser", body);
        // messageApi.open({ type: resp.code == 0 ? 'success' : 'error', content: resp.message });
        if (resp2.code == 0) {
            setVale('TouristsAuth', resp2.data);
            set_commentsList(prev => prev.map(m => {
                if (m.id === props.id) {
                    m.likes = newLikes;
                }
                if (m.children.length) {
                    m.children = m.children.map(item => (item.id === props.id ? { ...item, likes: newLikes } : item));
                }
                return m;
            }));
        } else {
            messageApi.open({ type: 'error', content: resp2.message });
        }
    }

    // 聚焦时自动展开 textarea 并聚焦
    useEffect(() => {
        if (focused && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [focused]);

    useEffect(() => {

        if (TouristsAuth.avatar == undefined) {
            const { setVale } = useAuthStore.getState();
            setVale('TouristsAuth', Object.assign(TouristsAuth, auth));
        }
        console.log('游客用户：', TouristsAuth);
        console.log('后台用户：', auth)
    }, []);

    return (
        <div className='CommentList'>
            {/* 评论列表区 */}
            <div className='CommentList-scroll' ref={scrollRef}>
                {commentCount.current === 0 ? (
                    <div className='CommentList-empty'>
                        <MessageOutlined style={{ fontSize: 36, color: 'var(--color-quaternary-label)' }} />
                        <p>暂无评论，快来抢沙发吧~</p>
                    </div>
                ) : commentsList.map(item => (
                    <>
                        {!item.hide && <div key={item.id} className='CommentList-item'>
                            <div className='item-commnet'>
                                <Avatar size={36} src={FILE_BASEURI + (item.Tourist?.avatar || item.User?.avatar || '')} />
                                <div className='item-commnet-right'>
                                    <p className='nickName'>{item.Tourist?.nickName || item.User?.nickName || '游客'}{currentArticle.userId === item.User?.id && <Tag>作者</Tag>}</p>
                                    <pre>{item.context}</pre>
                                    <div className='dateAndIP'>
                                        <span>{formatCommentTime(item.createdAt)}</span>
                                        <span>{item.ClientIp}</span>
                                    </div>
                                    <Space size='small'>
                                        {editLikeStrings().includes(TouristsAuth.id + '_' + currentArticle.id + '_' + item.id) ? <HeartFilled onClick={() => onLikeClick(item)} style={{ color: 'var(--color-red)' }} /> : <HeartOutlined onClick={() => onLikeClick(item)} />}
                                        <span className='textSpan' onClick={() => onLikeClick(item)}>{item.likes || 0}</span>
                                        <MessageOutlined onClick={() => ToMessage(item)} />
                                        <span className='textSpan' onClick={() => ToMessage(item)}>{item.children.length || '回复'}</span>
                                        {item.CommentStatus_display && <Tag color='#f28a22'>{item.CommentStatus_display}</Tag>}
                                        {item.CommentStatus_display && <Tag>仅自己可见</Tag>}
                                    </Space>
                                </div>
                                <MoreOutlined style={{ fontSize: 16, color: 'var(--color-tertiary-label)', cursor: 'pointer', flexShrink: 0 }} />
                            </div>


                            {item.children.length > 0 && !item.hide && < div className='replies'>
                                {item.children.map(childs => (
                                    <>
                                        {!childs.hide && <div className='reply-item' key={childs.id + childs.createdAt}>
                                            <Avatar size={28} src={FILE_BASEURI + (childs.Tourist?.avatar || childs.User?.avatar || '')} />
                                            <div className='reply-item-right'>
                                                <p className='nickName'>{childs.Tourist?.nickName || childs.User?.nickName} {currentArticle.userId === childs.User?.id && <Tag>作者</Tag>}{childs.Commentobject == item.id ? null : <><CaretRightOutlined />{nodeMaps.current.get(childs.Commentobject)?.Tourist?.nickName || nodeMaps.current.get(childs.Commentobject)?.User?.nickName}</>}</p>
                                                <pre>{childs.context}</pre>
                                                <div className='dateAndIP'>
                                                    <span>{formatCommentTime(childs.createdAt)}</span>
                                                    <span>{childs.ClientIp}</span>
                                                </div>
                                                <Space size='small'>

                                                    {editLikeStrings().includes(TouristsAuth.id + '_' + currentArticle.id + '_' + childs.id) ? <HeartFilled onClick={() => onLikeClick(item, childs)} style={{ color: 'var(--color-red)' }} /> : <HeartOutlined onClick={() => onLikeClick(item, childs)} />}
                                                    <span className='textSpan' onClick={() => onLikeClick(item, childs)}>{childs.likes || 0}</span>
                                                    <MessageOutlined onClick={() => ToMessage(item, childs)} />
                                                    <span className='textSpan' onClick={() => ToMessage(item, childs)}>{childs.replyCount || '回复'}</span>
                                                    {childs.CommentStatus_display && <Tag color='#f28a22'>{childs.CommentStatus_display}</Tag>}
                                                    {childs.CommentStatus_display && <Tag>仅自己可见</Tag>}
                                                </Space>
                                            </div>
                                            <MoreOutlined style={{ fontSize: 16, color: 'var(--color-tertiary-label)', cursor: 'pointer', flexShrink: 0 }} />
                                        </div>}
                                    </>))}
                            </div>}
                        </div>}
                    </>
                ))}

            </div>

            {/* 回到顶部按钮 */}
            {showBackTop && (
                <div className='back-top' onClick={scrollToTop} title='回到顶部'>
                    <VerticalAlignTopOutlined />
                </div>
            )}
            {/* 刷新按钮 */}
            <div className='back-top' style={{ bottom: 50 }} onClick={reLoad} title='刷新评论'>
                <ReloadOutlined />
            </div>

            {/* 底部评论输入框 */}
            <div className={`CommentList-input ${focused ? 'is-focused' : ''}`}>
                {/* 回复目标提示（写死示例，后续替换为真实逻辑） */}
                {focused && (currentComment?.Tourist || currentComment?.User) && <div className='reply-target'>
                    <div className='reply-target-info'>
                        <span className='reply-target-label'>回复 <b>{currentComment?.Tourist?.nickName || currentComment?.User?.nickName}</b>{currentArticle.userId === currentComment.User?.id && <Tag>作者</Tag>}</span>
                        <div className='reply-target-content'>{currentComment.context}</div>
                    </div>
                </div>}

                <div className='input-row'>
                    <Avatar size={32} src={FILE_BASEURI + TouristsAuth.avatar} />
                    <div className='input-area'>
                        {!focused ? (
                            <Input
                                placeholder={(!TouristsAuth.name && TouristsAuth.isBanned) ? '禁言中' : '说点什么...'}
                                className='comment-input'
                                readOnly
                                onFocus={() => {
                                    if (!(!TouristsAuth.name && TouristsAuth.isBanned)) {
                                        setFocused(true)
                                    }

                                }}
                            />
                        ) : (
                            <div className='textarea-wrap'>
                                <Input.TextArea
                                    ref={textareaRef}
                                    placeholder='说点什么...'
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    maxLength={200}
                                    autoSize={{ minRows: 2, maxRows: 6 }}
                                    className='comment-textarea'
                                    onBlur={() => {
                                        !inputValue.length && set_currentComment({});

                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}

                                />
                                <span className='char-count'>{inputValue.length}/200</span>
                            </div>
                        )}
                        {focused && (
                            <div className='input-actions'>
                                <SmileOutlined className='emoji-btn' />
                                <Button size='small' onClick={handleCancel}>取消</Button>
                                <Button type='primary' size='small' disabled={!inputValue.trim()} onClick={handleSend}>发送</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
export default CommentList;