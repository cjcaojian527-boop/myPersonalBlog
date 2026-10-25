import React, { useState, useEffect, useRef } from 'react';
import { PartitionOutlined, FieldTimeOutlined, VerticalAlignTopOutlined, SnippetsOutlined } from '@ant-design/icons';
import { FILE_BASEURI } from '@utils/const';
import { Avatar, Image, Space, Tag } from 'antd';
import { formatDate, useLazyLoad } from '@utils/utils';
import CodeViewComp from '@/views/CodeViewComp';
import './index.scss';
import imgError from '@assets/imgerror.png';
import PlaceholderImage from '@assets/placeholder.jpg';
import VideoError from '@assets/videoerror.png';



const ArticlePreviewComp = (props) => {
    const { contextList = [],
        Params = {},
        listHeight = 530,
    } = props;
    Params.Labels = Params.Labels || [];
    // console.log("Params:",Params);



    const fileviewMap = {
        // 视频
        'video/mp4': item => <PreviewVideo item={item} />,
        'video/webm': item => <PreviewVideo item={item} />,
        'video/ogg': () => "暂不支持预览",
        // mov: 'video/quicktime',
        // avi: 'video/x-msvideo',
        // mkv: 'video/x-matroska',

        // PDF
        'application/pdf': ({ elementType, content, id }) => (<div className='iframe-div' >
            <iframe
                src={FILE_BASEURI + content[0]?.url}
                title={content[0]?.name}
                width="100%"
            />
        </div>),
    }

    const PreviewVideo = ({ item: { content } }) => {
        const [failed, setFailed] = useState(false);

        return (<div className='iframe-div'>
            <video
                title={failed ? '加载失败' : content[0]?.name}
                src={FILE_BASEURI + content[0]?.url}
                controls
                autoPlay
                muted
                loop
                poster={failed ? VideoError : ''}
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}

            > 您的浏览器不支持 video 标签</video>
        </div>)

    }

    const PreviewImage = ({ item: { content } }) => {
        const [failed, setFailed] = useState(false);

        return (<Image
            title={failed ? '加载失败' : content[0]?.name}
            onError={() => setFailed(true)}
            preview={!failed}
            src={FILE_BASEURI + content[0]?.url}
            fallback={imgError} />);

    }


    const RenderItem = ({ item }) => {
        const { elementType = '/', content, id } = item;

        const [ref, visible] = useLazyLoad('contextList');
        if (elementType.includes('/')) {
            if (fileviewMap[elementType]) {
                return fileviewMap[elementType](item);
            }

            if (contextList.length == 1) {
                return (<div> <PreviewImage item={item} /></div>)
            }

            return (<div className='PreviewImage' ref={ref}>{visible ? <PreviewImage item={item} /> : <img src={PlaceholderImage} />}</div>)

        } else if (elementType == 'text') {
            const htmlContent = `<pre>${content}</pre>`
            return <div dangerouslySetInnerHTML={{ __html: htmlContent }} ></div>

        } else if (elementType == 'code') {
            return <div className='code-div'><CodeViewComp codeString={item.content} /></div>

            // return <div key={id}>{item.content}</div>;

        } else {
            const htmlContent = `<${elementType}><pre>${content}</pre></${elementType}>`
            return <div dangerouslySetInnerHTML={{ __html: htmlContent }} ></div>
        }


    }

    const floatingHandClick = () => {
        // console.log(type);
        const root = document.getElementById('contextList');
        root.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (<>
        <div className='ArticlePreviewComp' key={'articleIn' + Params.createdAt}>
            <h2 title={Params.title || ''}>{Params.title || '文章标题'}</h2>
            <Space>
                {Params?.User?.avatar && <Avatar size={32} src={FILE_BASEURI + Params.User.avatar || null} >{!Params?.User?.avatar ? (Params?.User?.name_display || Params?.User?.name) : null}</Avatar>}
                <Tag>{(Params?.User?.name_display || Params?.User?.name) || '作者'}</Tag>
                <Tag color='blue' icon={<PartitionOutlined />}>{Params.articleType_display || ':XXXX'}</Tag>
                <Tag color='#f56380' icon={<FieldTimeOutlined />}>{Params.createdAt ? formatDate(Params.createdAt) : ':XXXX'}</Tag>
                {Params.Labels.map(m => (<Tag color='#7e2bea' icon={<SnippetsOutlined />} key={m.labelId}>{m.labelName}</Tag>))}
                {contextList.length > 1 && <div className='btn-wrapper' title='回到顶部' onClick={floatingHandClick}> <VerticalAlignTopOutlined /></div>}
                {/* <Tag>标签...</Tag> */}
            </Space>

            <div className='list' id='contextList' style={{ height: listHeight }}>
                {contextList.slice().sort((a, b) => a.order - b.order).map(m => (<RenderItem key={m.id} item={m} />))}
            </div>
        </div>
    </>);

}
export default React.memo(ArticlePreviewComp, (prev, next) => {
    return prev.Params?.id === next.Params?.id
        && prev.contextList === next.contextList
        && prev.listHeight === next.listHeight;
});