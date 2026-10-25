import React, { useState, useRef, useEffect } from 'react';
import './scss/Header';
import { App, Avatar, Space, Popconfirm, Button, Modal, Badge, notification, List, Tag } from 'antd';
import { SmileFilled, LogoutOutlined, BellOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { resovleFormItem } from '@views/antd/form/form-utils';
import FormComp from '@views/antd/form';
import { useUsers } from '@/pages/admin/models';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { suorceMenus } from '@/router';
import { FILE_BASEURI } from '@utils/const';
import Dalanbenlogo from '@assets/dalanbenlogo2.png';
import { postRequest, fileRequest } from '@utils/api';
import { useTabsStore } from '@/store';

const HeaderComp = () => {
    const route = useNavigate();
    const users = useAuthStore(state => state.auth);
    const { setVale } = useAuthStore.getState();
    const { message: messageApi } = App.useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingCount, set_pendingCount] = useState(0); // 待审核评论数量
    const [pendingList, set_pendingList] = useState([]); // 待审核评论列表
    const [api, contextHolder] = notification.useNotification();
    const formRef = useRef(null);
    const [FormCompData, set_FormCompData] = useState({});



    const { getupdatedrawerForm } = useUsers.getState();


    const onFinish = async () => {
        const { getFieldsValue } = formRef.current.form;
        const body = { ...getFieldsValue(), id: users.id };

        // console.log(body);


        if (body.avatar?.[0]?.originFileObj) {
            const formData = new FormData();
            const Filemethod = 'update';
            formData.append('file', body.avatar[0].originFileObj);
            formData.append('objectName', users.avatar);
            const FileResp = await fileRequest("/api/files/" + Filemethod, formData);
            console.log('修改头像：', FileResp);
            if (FileResp.code == 0) {
                body.avatar = FileResp.data;
            }
        }
        const method = 'updateUser';
        const resp = await postRequest("/api/auth/" + method, body);

        if (resp.code == 0) {
            messageApi.open({ type: 'success', content: resp.message });
            // setIsModalOpen(false);
            // set_FormCompData({});

            //当前用户直接退出
            if (resp.data?.name !== users.name) {
                messageApi.open({ type: 'success', content: '账户变更，请重新登录！' });
                route('/Login', { replace: true });
            }

            setVale('auth', { ...users, ...resp.data });
        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }
    }


    const showModal = () => {

        const columnList = resovleFormItem(getupdatedrawerForm(['createdAt', 'password', 'avatar']));
        const initialValues = { ...users, password: '' }
        const props = {
            columnList, initialValues, children: (<></>),
            onFinish: () => onFinish(),
        }
        setIsModalOpen(() => {
            set_FormCompData(props)
            return true;
        });
    };


    const handleOk = () => {
        const { submit, isFieldsTouched } = formRef.current.form;
        if (!isFieldsTouched()) {
            messageApi.open({ type: 'error', content: '未进行操作，无需保存！' });
            return;
        }
        submit();

    };
    const handleCancel = () => {
        setIsModalOpen(false);
        set_FormCompData({});
    };



    const getUnreadMessages = async () => {
        const resp = await postRequest("/api/comment/getComment", {
            formData: {
                "name": users.id,
                "CommentStatus": "pending"
            }
        });
        console.log('查询结果：', resp);
        if (resp.code == 0 && resp.data) {
            set_pendingCount(resp.data.total || 0);
            set_pendingList(resp.data.list || []);
            return [resp.data.list, resp.data.total];
        } else {
            return [[], 0];
        }
    }

    const messageClick = (comment, destroy = () => { }) => {
        // console.log('审核评论:', comment);
        const { addTabs, setVale: setTabs, currentTab, Tabs } = useTabsStore.getState();
        // console.log(currentTab, Tabs);

        const isCurrent = Tabs.some(f => f.key == currentTab && f.routepath == "/admin/comment");

        const tab = suorceMenus.find(f => f.absolutePath === '/admin/comment');
        if (tab) {
            if (isCurrent) {
                messageApi.info('您已在评论管理菜单！');
                destroy();
                return;
            }

            const isShouye = tab.absolutePath === '/admin/index';//是否首页
            const tabKey = tab.id + '';
            addTabs({
                label: tab.label,
                key: tabKey,
                closable: !isShouye,
                routepath: tab.absolutePath,
            });
            setTabs("currentTab", tabKey);
            route(tab.absolutePath + '?_menu' + Date.now(), { state: comment });
            destroy();
        } else {
            messageApi.info('打开菜单失败，请手动打开评论管理菜单！');
            destroy();
        }

    }

    // 点击铃铛图标事件
    const handleBellClick = async () => {
        const [list, total] = await getUnreadMessages();
        if (total === 0) {
            messageApi.info('暂无待审核评论');
            return;
        }

        const notificationKey = 'pending-review-notification';
        api.info({
            key: notificationKey,
            message: `待审核评论 (${pendingCount}条)`,
            description: (
                <List
                    size="small"
                    dataSource={pendingList.slice(0, 5)}
                    renderItem={(item) => (
                        <div style={{
                            padding: '10px 12px',
                            marginBottom: 8,
                            background: '#fffbe6',
                            border: '1px solid #ffe58f',
                            borderRadius: 6,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontWeight: 500, fontSize: 13 }}>
                                    <Tag color="orange" icon={<ClockCircleOutlined />} style={{ marginRight: 6 }}>待审核</Tag>
                                    评论人：{item.Tourist?.nickName || '游客'}
                                </span>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => messageClick(item, () => api.destroy(notificationKey))}
                                >
                                    去审核
                                </Button>
                            </div>
                            <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>
                                文章：{item.ArticleList?.title || '未知文章'}
                            </div>
                            <div
                                title={item.context}
                                style={{
                                    color: '#333',
                                    background: '#fff',
                                    padding: '6px 10px',
                                    borderRadius: 4,
                                    borderLeft: '3px solid #faad14',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {item.context}
                            </div>
                        </div>
                    )}
                />
            ),
            placement: 'bottomRight',
            duration: 3,
            style: { width: 380 },
        });
    }

    useEffect(() => {
        const fetchMessages = async () => {
            await getUnreadMessages();
        };
        fetchMessages();
    }, []);


    return (<>
        {contextHolder}
        {/* <h2>Hi ~ Welcome To Admin System ! <SmileFilled style={{ fontSize: 20 }} /></h2> */}

        <div className='logo'>
            <img src={Dalanbenlogo} alt="" />
        </div>
        <div className='rightIcon'>
            <Space wrap size={16}>

                <Avatar onClick={showModal} title={(users.name)} size="large" src={FILE_BASEURI + users.avatar || null} >{!users.avatar ? (users.name_display || users.name) : null}</Avatar>
                {pendingCount > 0 && (
                    <Badge count={pendingCount} size="small" offset={[-2, 2]}>
                        <div
                            className='bell-icon'
                            onClick={handleBellClick}
                            style={{
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                fontSize: 20,
                                color: '#fff'
                            }}
                        >
                            <BellOutlined />
                        </div>
                    </Badge>
                )}
                <Popconfirm
                    placement="leftTop"
                    title="提示"
                    description="Are you sure you want to log out?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => route('/Login', { replace: true })}
                >
                    {/* <Button danger>Delete</Button> */}
                    <LogoutOutlined />
                </Popconfirm>

            </Space>

        </div>

        <Modal
            title="用户信息详情"
            mask={{ closable: false }}
            closable={false}
            open={isModalOpen}
            destroyOnHidden
            onOk={handleOk}
            onCancel={handleCancel}
        >
            <FormComp ref={formRef} {...FormCompData} />
        </Modal>

    </>)

}
export default HeaderComp;