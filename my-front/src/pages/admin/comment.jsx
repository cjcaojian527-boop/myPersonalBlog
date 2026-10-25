import React, { useState, useEffect, useRef } from 'react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import FormComp from '@views/antd/form';
import TableComp from '@views/antd/table';
import DrawerComp from '@views/antd/Drawer';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import { useLocation } from 'react-router-dom';
import './scss/MenusCrud';
import { useAuthStore } from '@/store';
import { postRequest, getRequest } from '@utils/api';
import { deepClone } from '@utils/utils';
import { useComments } from './models/Comments';
const { confirm } = Modal;

const rowBtns = [
    { size: 'small', action: 'approved', text: '通过' },
    { size: 'small', action: 'rejected', text: '驳回' },
    { type: 'primary', action: 'modify', size: 'small', text: '修改评论', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除评论', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增评论', icon: <PlusCircleOutlined /> },

]

const CommentsComp = () => {

    const { ColumnList: _columnList, tableColumns, getadddrawerForm } = useComments.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const { state: LocationParams } = useLocation();  // state.row
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置
    const auth = useAuthStore(state => state.auth);
    const [formColumns, set_formColumns] = useState(_columnList);
    // const columnList = resovleFormItem(_columnList);



    const searchData = async (queryData = {}) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const body = { ...getFieldsValue() };
        if (body.Commentobject_id !== undefined) {
            body.Commentobject = body.Commentobject_id;
            delete body.Commentobject_id;
        }

        const resp = await postRequest("/api/comment/getComment", { formData: body, ...pageInfo, ...queryData });
        console.log('查询结果：', resp);

        if (resp.code == 0 && resp.data) {
            messageApi.open({ type: 'success', content: resp.message });
            setTotal(resp.data.total);
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
                if (auth.role == 'temp_admin') {
                    messageApi.open({ type: 'error', content: '权限不足，操作失败！' });
                    return;
                }

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
                    title: '确认删除评论吗',
                    icon: <ExclamationCircleFilled />,
                    onOk: () => deleteRow(row),
                    onCancel() {

                    },
                });

            } else if (action === 'approved' || action === 'rejected') {
                //通过
                if (row.CommentStatus == 'pending') {
                    updateCommentState(row, action)
                } else {
                    messageApi.open({ type: 'error', content: '该评论已审批过！' });
                }

            } else {
                set_DrawerData(getDrawerData(action, row))
            }
        }

    }

    const updateCommentState = async (row, action) => {
        const body = { CommentStatus: action, id: row.id };
        const resp = await postRequest("/api/comment/updateComment", body);


        if (resp.code == 0) {
            messageApi.open({ type: 'success', content: resp.message });
            const { getFieldsValue } = formRef.current.form;
            searchData({
                formData: getFieldsValue().name == auth.id ? {
                    "name": auth.id,
                    "CommentStatus": "pending"
                } : {}
            });

        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }
    }
    const pageChange = (page, pageSize) => {
        searchData({ page, pageSize })
        set_pageInfo({ page, pageSize });
    }

    const deleteRow = async ({ id, tId, articleId }) => {
        if (id == undefined) return;
        const resp = await getRequest("/api/comment/destroyComment", { id, tId, articleId });
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
            const method = action == 'modify' ? 'updateComment' : 'addComment';
            const body = { ...getFieldsValue() };

            if (body.Commentobject_id !== undefined) {
                body.Commentobject = body.Commentobject_id;
                delete body.Commentobject_id;
            }
            if (action == 'modify') {
                body.id = data.id;
            } else {
                body.isPass = true;
            }
            const resp = await postRequest("/api/comment/" + method, body);

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

    const ValuesChange = (formData, _flag) => {
        // console.log(formData, _flag);
        // const { setFieldValue } = drawerformRef.current.form;

    }

    const getDrawerData = (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增评论';
            // console.log(getadddrawerForm())

            const columnList = resovleFormItem(getadddrawerForm(['createdAt', 'name']));
            const initialValues = {}
            itme.children = <FormComp ref={drawerformRef} ValuesChange={ValuesChange}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={columnList} />


        } else if (action == 'modify') {
            itme.title = '修改评论';
            // const columnList = resovleFormItem(getadddrawerForm());
            const filterList = ['createdAt', 'name', 'Commentobject_id']
            if (row.tId == null || row.tId == undefined) {
                filterList.push('tId');
            }
            let columnList = deepClone(getadddrawerForm(filterList));
            const initialValues = { ...row };
            // 给 DebounceSelect 字段注入初始选项
            columnList.forEach(item => {
                if (item.name === 'articleId') {
                    item.editer.renderProps.options = row.articleId !== undefined && row.ArticleList
                        ? [{ value: row.articleId, label: row.ArticleList.title }]
                        : [];
                }
                if (item.name === 'tId') {
                    item.editer.renderProps.options = row.tId !== undefined && row.Tourist
                        ? [{ value: row.tId, label: row.Tourist.nickName }]
                        : [];
                }
            });



            columnList = resovleFormItem(columnList);

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={() => DrawerFinish({ ...row }, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {

        }
        itme.open = true;
        return itme;

    }

    const autoSerachData = (comment) => {
        const { setFieldValue } = formRef.current.form;
        set_formColumns(prev => {
            searchData({
                formData: {
                    "name": auth.id,
                    "CommentStatus": "pending"
                }
            });
            return prev.map(item => {
                if (item.name === 'name') {
                    item.editer.renderProps.options = [{ value: auth.id, label: auth.name }]
                }
                return { ...item };
            });
        });
        setFieldValue("name", auth.id);
        setFieldValue("CommentStatus", "pending");

    }


    useEffect(() => {
        setTimeout(() => searchData(), 0);
        console.log("LocationParams:", LocationParams);
        if (LocationParams) {
            autoSerachData(LocationParams);
        }
    }, []);

    return (
        <div className='MenusCrud-contenier'>
            <div className='MenusCrud-form'>
                <FormComp ref={formRef} onFinish={searchData} columnList={resovleFormItem(formColumns)} ></FormComp>
            </div>
            <div className='MenusCrud-table'>
                <TableComp columns={tableColumns} total={total} tableData={tableData} title='游客评论管理' btns={btns}
                    loading={loading} pageChange={pageChange}
                    rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
            </div>
            <DrawerComp {...DrawerData}></DrawerComp>
        </div>);
}
export default CommentsComp;