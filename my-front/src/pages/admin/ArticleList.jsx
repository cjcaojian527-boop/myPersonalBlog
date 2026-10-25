import React, { useState, useEffect, useRef } from 'react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleFilled, MessageOutlined } from '@ant-design/icons';
import FormComp from '@views/antd/form';
import TableComp from '@views/antd/table';
import DrawerComp from '@views/antd/Drawer';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import './scss/MenusCrud';
import { postRequest, getRequest, fileRequest } from '@utils/api';
import { deepClone, getCommentTrees } from '@utils/utils';
import { useArticleList } from './models/ArticleList';
import CommentList from '@views/antd/CommentList';
import { useTabsStore } from '@/store';
import { suorceMenus } from '@/router';
import { useAuthStore } from '@/store';
import { useNavigate, useLocation } from 'react-router-dom';

const { confirm } = Modal;

const rowBtns = [
    { size: 'small', action: 'view', text: '查看内容', icon: <EyeOutlined /> },
    { size: 'small', action: 'openComment', text: '打开评论', icon: <MessageOutlined /> },
    { type: 'primary', action: 'modify', size: 'small', text: '修改文章', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除文章', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增文章', icon: <PlusCircleOutlined /> },

]

// const useColumnListAsync = (sourceData) => {
//     let _columnList = deepClone(sourceData);
//     const [list, setList] = useState([]);
//     useEffect(() => {
//         Promise.all([postRequest("/api/auth/queryUsers", { formData: {}, pageSize: 100 }), getRequest("/api/articleType/getList", {})]).then(([usersResp, typesResp]) => {
//             if (usersResp.code == 0 && usersResp.data?.list?.length) {
//                 _columnList[2].editer.renderProps.options = usersResp.data.list.map(({ id: value, name: label }) => ({ value, label }));
//             }
//             if (typesResp.code == 0 && typesResp.data?.length) {
//                 _columnList[1].editer.renderProps.options = typesResp.data.map(({ typeId: value, typeName: label }) => ({ value, label }));
//             }
//             setList(_columnList);
//         });

//     }, [sourceData]);
//     return list;

// }



const ArticleListComp = () => {

    const { ColumnList: _columnList, tableColumns, getadddrawerForm } = useArticleList.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(true);
    const [total, setTotal] = useState(10);
    const { addTabs, setVale } = useTabsStore.getState();
    const [pageInfo, set_pageInfo] = useState({ pageNum: 1, pageSize: 10 }); // 分页配置
    // const _LIST = useColumnListAsync(_columnList);
    const [columnList, set_columnList] = useState(_columnList);
    const navigate = useNavigate();
    const { state: LocationParams } = useLocation();  // state.row

    // const columnList = resovleFormItem(_LIST);


    const searchData = async (queryData = {}, items = columnList, callback = () => { }) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const formData = {};
        Object.keys(getFieldsValue()).forEach(key => {
            if (Array.isArray(getFieldsValue()[key]) && !getFieldsValue()[key].length) {
                console.warn(key + ': 数组长度为0');
            } else {
                formData[key] = getFieldsValue()[key];
            }
        })

        const resp = await postRequest("/api/artcle/getList", { formData, ...pageInfo, ...queryData });
        console.log('searchData查询结果：', resp);

        if (resp.code == 0 && resp.data) {
            messageApi.open({ type: 'success', content: resp.message });
            setTotal(resp.data.total);
            const _display = ['userId', 'articleType'];

            resp.data.list = resp.data.list.map(obj => {
                Object.keys(obj).forEach(key => {
                    if (_display.includes(key)) {
                        const item = items.find(f => f.name === key);

                        if (item) {
                            const label = item.editer.renderProps.options.find(f => f.value === obj[key])?.label || obj[key];
                            obj[key + '_display'] = label;
                        }

                    }
                });
                return obj;

            });
            callback(resp.data.list);

            set_tableData(resp.data.list);
        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }

        set_loading(false);

    }



    const btnHandClick = (obj, type) => {
        console.log(obj, type);
        const { action, row } = obj;
        if (type == 'top') {

            if (action == 'add') {
                set_DrawerData(getDrawerData(action))
            } else if (action == 'modify') {
                // set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {

            }
        } else {
            if (action == 'add') {

            } else if (action == 'modify') {
                set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {
                confirm({
                    title: '确认删除文章吗',
                    icon: <ExclamationCircleFilled />,
                    onOk: () => deleteRow(row),
                    onCancel() {

                    },
                });

            } else if (action == 'view') {
                const tab = suorceMenus.find(f => f.absolutePath === '/admin/Context');
                if (tab) {
                    const isShouye = tab.absolutePath === '/admin/index';//是否首页
                    const tabKey = tab.id + '';
                    addTabs({
                        label: tab.label,
                        key: tabKey,
                        closable: !isShouye,
                        routepath: tab.absolutePath,
                    });
                    setVale("currentTab", tabKey);
                    navigate(tab.absolutePath + '?_menu' + Date.now(), { state: row })
                } else {
                    messageApi.open({ type: 'error', content: '未找到tab页' });
                }


            } else if (action === 'openComment') {
                openCommentList(row);
            } else {
                set_DrawerData(getDrawerData(action, row))
            }
        }

    }


    //博主打开评论区
    const openCommentList = async (currentArticle) => {
        const resp = await postRequest("/api/comment/getComment", { formData: { articleId: currentArticle.id }, pageSize: 1000 });
        console.log('查询结果：', resp);
        if (resp.code == 0 && resp.data?.list?.length) {
            const [Pnodes, nodeMap, commentCount] = getCommentTrees(resp.data.list.filter(f => f.Commentobject == -1), resp.data.list.filter(f => f.Commentobject !== -1));

            const itme = {
                open: true,
                onClose: DrawerClear,
                title: <h3 style={{ color: '#4b4b4b' }}>{`共 ${commentCount} 条评论`}</h3>,
                children: <CommentList comments={Pnodes} Count={commentCount} nodeMap={nodeMap} currentArticle={currentArticle} />
            };
            set_DrawerData(itme);
        } else {
            const itme = {
                open: true,
                onClose: DrawerClear,
                title: <h3 style={{ color: '#4b4b4b' }}>欢迎留言评论😁</h3>,
                children: <CommentList currentArticle={currentArticle} />
            };
            set_DrawerData(itme);
        }
    }
    const pageChange = (pageNum, pageSize) => {

        searchData({ pageNum, pageSize });
        set_pageInfo({ pageNum, pageSize });
    }

    const deleteRow = async ({ id }) => {
        if (id == undefined) return;
        const resp = await getRequest("/api/artcle/destroy", { id });
        if (resp.code == 0) {
            messageApi.open({ type: 'success', content: resp.message });
            searchData();
        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }
    }

    const DrawerClear = () => {
        set_DrawerData(state => ({ ...state, title: '', open: false }));
    }

    //提交保存更改
    const DrawerFinish = async (data, action) => {
        const { setFieldValue, getFieldsValue, submit } = drawerformRef.current.form;

        if (action == 'add' || action == 'modify') {
            const method = action == 'modify' ? 'update' : 'add';
            let body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.id = data.id;
            }
            // console.log(body);
            // return;
            if (body.coverImage?.[0]?.originFileObj) {
                const formData = new FormData();
                const Filemethod = action == 'modify' ? 'update' : 'upload';
                formData.append('file', body.coverImage[0].originFileObj);

                if (action == 'modify') {
                    //修改
                    formData.append('objectName', data.coverImage);
                }
                const FileResp = await fileRequest("/api/files/" + Filemethod, formData);
                console.log(FileResp);
                if (FileResp.code == 0) {
                    body.coverImage = FileResp.data;
                }
            }

            const resp = await postRequest("/api/artcle/" + method, body);

            if (resp.code == 0) {
                messageApi.open({ type: 'success', content: resp.message });
                searchData();
                DrawerClear();
            } else {
                messageApi.open({ type: 'error', content: resp.message });
            }

        } else if (action == 'test') {

        }
    }


    const DrawerDataSubmit = (Data) => {
        const { submit, isFieldsTouched } = drawerformRef.current.form;
        if (!isFieldsTouched() && Data == 'modify') {
            messageApi.open({ type: 'error', content: '未进行操作，无需保存！' });
            return;
        }
        submit();
    }

    const resetFields = () => {
        const { resetFields: _resetFields } = drawerformRef.current.form;
        _resetFields();
    }

    const getDrawerData = (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增文章';


            const items = resovleFormItem(getadddrawerForm(columnList));
            const initialValues = {}
            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={items} />



        } else if (action == 'modify') {
            itme.title = '修改文章';
            const { auth: { role } } = useAuthStore.getState();
            console.log('role:',role)
            const filters = ['labelId', 'isTop', 'likes'];
            let hides = [];
            //临时用户修改自己文章时 隐藏userId字段
            if (role === 'temp_admin' && row.User?.role=='temp_admin') {
                hides.push('userId')
            }
            const items = resovleFormItem(getadddrawerForm(columnList, filters, hides));
            const initialValues = { ...row, labelId: row.Labels.map(m => m.labelId) }

            itme.children = <FormComp ref={drawerformRef}
                children={<>
                    <Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button>
                    <Button onClick={resetFields}>重 置</Button>
                    <Button onClick={DrawerClear}>取 消</Button>
                </>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(row, 'modify')} columnList={items} />

        } else if (action == 'delete') {

        } else {

        }
        itme.open = true;
        return itme;

    }
    const autoSerachData = ({ ArticleLists, typeId }) => {

        const { setFieldValue } = formRef.current.form;

        setFieldValue("articleType", typeId);

        if (ArticleLists.length == 1) {
            setFieldValue("title", ArticleLists[0].title);
            // searchData({}, [], list => {
            //     const row = list.find(f => f.id === ArticleLists[0].id);
            //     if (row) {
            //         btnHandClick({ row, action: 'modify' }, 'row');
            //     }
            // });
        }
        searchData();
    }


    useEffect(() => {
        let _List = deepClone(_columnList);
        const requestList = [
            postRequest("/api/auth/queryUsers", { formData: {}, pageSize: 100 }),
            getRequest("/api/articleType/getList", {}),
            postRequest("/api/labels/getLabels", { formData: {}, pageSize: 100 }),
        ];
        Promise.all(requestList).then(([usersResp, typesResp, labelResp]) => {
            set_loading(false);
            if (usersResp.code == 0 && usersResp.data?.list?.length) {
                _List[2].editer.renderProps.options = usersResp.data.list.map(({ id: value, name: label }) => ({ value, label }));
            }
            if (typesResp.code == 0 && typesResp.data?.length) {
                _List[1].editer.renderProps.options = typesResp.data.map(({ typeId: value, typeName: label }) => ({ value, label }));
            }
            if (labelResp.code == 0 && labelResp.data?.list?.length) {
                _List[3].editer.renderProps.options = labelResp.data.list.map(({ labelId: value, labelName: label }) => ({ value, label }));
            }
            // console.log(labelResp);
            set_columnList(() => {
                // console.log("_List:", _List);
                searchData({}, _List);
                return _List;
            });
            // console.log("LocationParams:", LocationParams);
            if (LocationParams?.typeId) {
                autoSerachData(LocationParams);
            }
        });

    }, []);

    // useEffect(() => {
    //     console.log("columnList 更新了:", columnList);
    // }, [columnList]);


    return (<div className='MenusCrud-contenier'>
        <div className='MenusCrud-form'>
            <FormComp ref={formRef} onFinish={searchData} columnList={resovleFormItem(columnList)} ></FormComp>
        </div>
        <div className='MenusCrud-table'>
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='文章管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default ArticleListComp;