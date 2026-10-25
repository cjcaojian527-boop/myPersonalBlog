import React, { useState } from 'react';
import { Masonry, Empty, Tag, Avatar } from 'antd';
import { HeartFilled, HeartOutlined, RedoOutlined, VerticalAlignTopOutlined, RetweetOutlined } from '@ant-design/icons';
import { FILE_BASEURI } from '@utils/const';
import { useLazyLoad } from '@utils/utils';
import { useAuthStore } from '@/store';
import imgError from '@assets/imgerror.png';
// import PlaceholderImage from '@assets/placeholder.jpg';
import './index.scss';


const PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <pattern id="stripes" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="24" height="24" fill="#e8e8e8"/>
      <rect width="12" height="24" fill="#f2f2f2"/>
    </pattern>
    <linearGradient id="shine" x1="-1" y1="0" x2="0" y2="0">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%"  stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      <animate attributeName="x1" values="-1;1" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="0;2"  dur="1.4s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#stripes)"/>
  <rect width="300" height="450" fill="url(#shine)"/>
</svg>`)}`;


// 封面懒加载图片（占位图 → 真实封面）
const LazyImage = ({ coverImage }) => {
    const [ref, visible] = useLazyLoad();

    return (
        <div ref={ref} className="img-wrapper">
            <img
                className="fengmian"
                src={visible && coverImage ? FILE_BASEURI + coverImage : PLACEHOLDER}
                style={{ width: '100%' }}
                onError={e => e.target.src = imgError}
            />
        </div>
    );
    // return (
    //     <div ref={ref} className="img-wrapper">
    //         {visible ? <img className='fengmian' src={coverImage ? FILE_BASEURI + coverImage : imgError} style={{ width: '100%' }} onError={e => e.target.src = imgError} /> : <img src={PlaceholderImage} alt="sample" style={{ width: '100%' }} />}
    //     </div>
    // );
};

// 文章瀑布流：类型 tab + 卡片流 + 触底加载 + 浮动按钮（受控展示组件，数据/业务由上层传入）
const ArticleWaterfall = ({
    items,
    articleTypes,
    currentTypeId,
    loadingTop,
    loding,
    sentinelRef,
    onSwitchType,
    onItemClick,
    onLikeClick,
    onReload,
}) => {
    const [showMoreTypes, set_showMoreTypes] = useState(false);   // 「更多」类型面板是否展开
    const TouristsAuth = useAuthStore(state => state.TouristsAuth);

    // 浮动按钮：1 回到顶部（滚动自己的根容器）；2 刷新（交给上层 reloadList）
    const floatingHandClick = (type) => {
        const root = document.getElementById('scrollable-container');
        if (type === 1) {
            root.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (type === 2) {
            onReload();
        }
    };

    const itemRender = (props) => {
        const { User: userData, coverImage, title, likes } = props;
        return <div className='IMAGE_BOX' onClick={e => onItemClick(e, props)}>
            <LazyImage coverImage={coverImage} />
            {props.isTop && <div className='isTop'>置顶</div>}
            {props.TagName && <Tag>{props.TagName}</Tag>}

            <p>{title}</p>
            <div className='Avatar_box'>
                <div>
                    <Avatar size={24} src={FILE_BASEURI + userData.avatar || null} >{!userData.avatar ? (userData.name_display || userData.name) : null}</Avatar>
                    <span className='userName'>{userData.name_display || userData.name || '用户'}</span>
                </div>

                <div className='zan' onClick={() => onLikeClick(props)}>
                    {TouristsAuth.likeStrings?.split(',').includes(props.id + '') ? <HeartFilled style={{ color: 'var(--color-red)' }} /> : <HeartOutlined />}
                    {likes || 0}</div>
            </div>
        </div>;
    };

    return (
        <>
            <div className='main-content' id='scrollable-container'>
                <div className='scroll-container'>
                    {/* <div className='item-tab item-tab-active'>推荐</div> */}
                    {articleTypes.slice(0, 15).map(m => (<div onClick={() => onSwitchType(m)} key={m.typeId} className={currentTypeId == m.typeId ? 'item-tab item-tab-active' : 'item-tab'}>{m.typeName}</div>))}

                    {articleTypes.length > 15 && <div onClick={() => set_showMoreTypes(v => !v)} className='item-tab'>{showMoreTypes ? '收起' : '更多'}</div>}
                </div>

                {/* 更多类型展开面板：点击「更多」展开，展示 15 个以后的类型 */}
                <div className={`more-types-panel ${showMoreTypes ? 'show' : ''}`}>
                    {articleTypes.slice(15).map(m => (
                        <div
                            key={m.typeId}
                            onClick={() => { onSwitchType(m); set_showMoreTypes(false); }}
                            className={`type-chip ${currentTypeId == m.typeId ? 'active' : ''}`}
                        >
                            {m.typeName}
                        </div>
                    ))}
                </div>
                <div className={`loadingTop ${loadingTop ? 'show' : ''}`}>
                    <RedoOutlined spin style={{ color: 'var(--color-quaternary-label)', fontSize: 20 }} />
                </div>
                <Masonry
                    columns={5}
                    gutter={16}
                    items={items}
                    itemRender={itemRender}
                />
                {items.length === 0 && (
                    <div className="empty-state">
                        <Empty description="Sorry, 未找到你想要的结果" />
                    </div>
                )}
                <div ref={sentinelRef} style={{ textAlign: 'center', height: 40 }} >{loding && <RedoOutlined spin style={{ color: 'var(--color-quaternary-label)', fontSize: 20 }} />}</div>
            </div>

            {/* 浮动按钮：回到顶部 / 刷新 */}
            <div className='floating-btn-sets'>
                <div className='btn-wrapper' title='回到顶部' onClick={() => floatingHandClick(1)}> <VerticalAlignTopOutlined /></div>
                <div className='btn-wrapper' title='刷新' onClick={() => floatingHandClick(2)}> <RetweetOutlined /></div>
            </div>
        </>
    );
};

export default ArticleWaterfall;
