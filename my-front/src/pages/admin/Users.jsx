
import React, { useState, useEffect, useRef } from 'react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import FormComp from '@views/antd/form';
import TableComp from '@views/antd/table';
import DrawerComp from '@views/antd/Drawer';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import './scss/MenusCrud';
import { useNavigate } from "react-router";
import { postRequest, fileRequest } from '@utils/api';

import { generateRandomAvatar } from '@utils/utils';
import { useUsers } from './models/Users';
import { useAuthStore } from '@/store';

const { confirm } = Modal;

const rowBtns = [

    { type: 'primary', action: 'modify', size: 'small', text: '修改用户', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除用户', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增用户', icon: <PlusCircleOutlined /> },

]

const UsersComp = () => {
    const { ColumnList: _columnList, tableColumns, getadddrawerForm, getupdatedrawerForm } = useUsers.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const navigate = useNavigate();
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置
    const columnList = resovleFormItem(_columnList);

    const searchData = async (queryData = {}) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const resp = await postRequest("/api/auth/queryUsers", { formData: getFieldsValue(), ...pageInfo, ...queryData });
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


    const btnHandClick = async (obj, type) => {

        const { action, row } = obj;
        if (type == 'top') {

            if (action == 'add') {
                set_DrawerData(await getDrawerData(action))
            } else if (action == 'modify') {

            } else if (action == 'delete') {

            }
        } else {
            if (action == 'add') {


            } else if (action == 'modify') {
                // if (row.isSystem) {
                //     messageApi.open({ type: 'error', content: '权限不足，不允许更改！' });
                //     return;
                // }
                set_DrawerData(await getDrawerData(action, row))
            } else if (action == 'delete') {
                // if (row.isSystem) {
                //     messageApi.open({ type: 'error', content: '权限不足，不允许删除！' });
                //     return;
                // }
                confirm({
                    title: '确认删除用户：[' + row.name + ']吗',
                    icon: <ExclamationCircleFilled />,
                    onOk: () => deleteRow(row),
                    onCancel() {

                    },
                });

            } else {
                set_DrawerData(await getDrawerData(action, row))
            }
        }

    }
    const pageChange = (page, pageSize) => {
        searchData({ page, pageSize });
        set_pageInfo({ page, pageSize });
    }

    const deleteRow = async ({ id, name: uName }) => {
        const { auth: { name } } = useAuthStore.getState();
        const resp = await postRequest("/api/auth/destroyUser", { id });
        if (resp.code == 0) {
            messageApi.open({ type: 'success', content: resp.message });
            if (uName === name) {
                messageApi.open({ type: 'success', content: '当前账号已被注销，请重新注册账号！' });
                navigate('/Login', { replace: true });
                return;
            }
            searchData();
        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }
    }

    const DrawerClear = () => {
        set_DrawerData(state => ({ ...state, title: '', open: false }));
    }

    //提交保存更改
    const DrawerFinish = async (row, action) => {
        const { getFieldsValue } = drawerformRef.current.form;
        // console.log("body:", { ...getFieldsValue() }, 'row:', row);
        if (action == 'add' || action == 'modify') {
            const method = action == 'modify' ? 'updateUser' : 'Register';
            const body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.id = row.id;
            }


            if (body.avatar?.[0]?.originFileObj) {
                const formData = new FormData();
                const Filemethod = action == 'modify' ? 'update' : 'upload';
                formData.append('file', body.avatar[0].originFileObj);

                if (action == 'modify') {
                    //修改
                    formData.append('objectName', row.avatar);
                }
                const FileResp = await fileRequest("/api/files/" + Filemethod, formData);
                console.log(FileResp);
                if (FileResp.code == 0) {
                    body.avatar = FileResp.data;
                }
            }

            const resp = await postRequest("/api/auth/" + method, body);

            if (resp.code == 0) {
                messageApi.open({ type: 'success', content: resp.message });

                DrawerClear();
                const { auth: { name } } = useAuthStore.getState();
                //当前用户直接退出
                if (action == 'modify' && resp.data?.name === name) {
                    messageApi.open({ type: 'success', content: '账户变更，请重新登录！' });
                    navigate('/Login', { replace: true });
                    return;
                }
                searchData();
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

    const getDrawerData = async (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增用户';


            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = { describe: '这个人很懒，什么都没留下...' };
            set_loading(true);
            const avatar = await generateRandomAvatar();
            initialValues['avatar'] = avatar;
            set_loading(false);

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={columnList} />



        } else if (action == 'modify') {
            itme.title = '修改用户';
            const filters = ['createdAt', 'password'];
            if (row.avatar && row.name === 'admin') {
                filters.push('avatar');
            }
            const columnList = resovleFormItem(getupdatedrawerForm(filters));
            const initialValues = { ...row, password: '' }


            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={() => DrawerFinish(row, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {
            itme.title = '查看用户';
            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = { ...row }
            if (initialValues.display === true) {
                initialValues.display = 1;
            } else initialValues.display = 0;
            itme.children = <FormComp ref={drawerformRef} disabled
                children={<><Button onClick={DrawerClear}>关 闭</Button></>}
                initialValues={initialValues} columnList={columnList} />
        }
        itme.open = true;
        return itme;

    }


    useEffect(() => {
        searchData()
    }, []);




    return (<div className='MenusCrud-contenier'>
        <div className='MenusCrud-form'>
            <FormComp ref={formRef} onFinish={searchData} columnList={columnList} ></FormComp>
        </div>
        <div className='MenusCrud-table'>
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='用户管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default UsersComp;