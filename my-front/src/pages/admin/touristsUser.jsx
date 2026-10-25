
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

import { generateRandomEmail, generateRandomAvatar } from '@utils/utils';
import { useTourists } from './models/Tourists';
import { useAuthStore } from '@/store';

const { confirm } = Modal;

const rowBtns = [

    { type: 'primary', action: 'modify', size: 'small', text: '修改游客', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除游客', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增游客', icon: <PlusCircleOutlined /> },

]


function isPlainObject(val) {
    return Object.prototype.toString.call(val) === '[object Object]';
}

const fetchOptions = async (title) => {
    // console.log(title);
    if (title === '') return [];
    const resp = await postRequest("/api/artcle/getList", { formData: { title } });
    // console.log(resp);
    if (resp.code == 0 && resp.data?.list?.length) {
        return resp.data.list.map(({ id: value, title: label }) => ({ value, label }));
    }
    return [];
}


const getArticleList = async (idStrings) => {
    if (idStrings == '' || idStrings.includes('[object Object]')) {
        return [];
    }

    const resp = await postRequest("/api/artcle/getList", { formData: { idStrings } });
    // console.log(resp);
    if (resp.code == 0 && resp.data?.list?.length) {
        return resp.data.list.map(({ id: value, title: label }) => ({ value, label }));
    }
    return [];
}

const TouristsUserComp = () => {
    const { ColumnList: _columnList, tableColumns, getadddrawerForm, getupdatedrawerForm } = useTourists.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const navigate = useNavigate();
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置


    _columnList.find(f => f.name === 'likeStrings').editer.renderProps['fetchOptions'] = fetchOptions;
    _columnList.find(f => f.name === 'viewStrings').editer.renderProps['fetchOptions'] = fetchOptions;


    const columnList = resovleFormItem(_columnList);

    const searchData = async (queryData = {}) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const resp = await postRequest("/api/touristsAuth/queryUsers", { formData: getFieldsValue(), ...pageInfo, ...queryData });
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
                    title: '确认删除游客：[' + row.nickName + ']吗',
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

    const deleteRow = async ({ id }) => {
        const resp = await postRequest("/api/touristsAuth/destroyUser", { id });
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
    const DrawerFinish = async (row, action) => {
        const { getFieldsValue } = drawerformRef.current.form;

        if (action == 'add' || action == 'modify') {
            const method = action == 'modify' ? 'updateUser' : 'Register';
            const body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.id = row.id;
            }

            console.log("body:", body);

            // body.likeStrings = body.likeStrings.join();
            // body.viewStrings = body.viewStrings.join();
            if (body.likeStrings?.length) {
                body.likeStrings = body.likeStrings.map(m => isPlainObject(m) ? m.value : m).join();
            } else {
                body.likeStrings = '';
            }
            if (body.viewStrings?.length) {
                body.viewStrings = body.viewStrings.map(m => isPlainObject(m) ? m.value : m).join();
            } else {
                body.viewStrings = '';
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

            const resp = await postRequest("/api/touristsAuth/" + method, body);

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

    const getDrawerData = async (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增游客';

            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = { 'email': generateRandomEmail(), isBanned: false };
            set_loading(true);
            const avatar = await generateRandomAvatar();
            set_loading(false);
            initialValues['avatar'] = avatar;

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={columnList} />


        } else if (action == 'modify') {
            itme.title = '修改游客';
            const columnList = resovleFormItem(getupdatedrawerForm(['createdAt', 'password']));
            const initialValues = { ...row };

            // body.likeStrings = body.likeStrings.join();
            // body.viewStrings = body.viewStrings.join();


            const Strings = [];
            if (initialValues.likeStrings) {
                Strings.push(getArticleList(initialValues.likeStrings));
            }
            if (initialValues.viewStrings) {
                Strings.push(getArticleList(initialValues.viewStrings));
            }
            if (Strings.length) {
                const [likes, views] = await Promise.all(Strings);
                initialValues.likeStrings = likes;
                initialValues.viewStrings = views;
            }

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={() => DrawerFinish(row, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {
            itme.title = '查看游客';
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
        setTimeout(() => searchData(), 0);
    }, []);




    return (<div className='MenusCrud-contenier'>
        <div className='MenusCrud-form'>
            <FormComp ref={formRef} onFinish={searchData} columnList={columnList} ></FormComp>
        </div>
        <div className='MenusCrud-table'>
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='游客管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default TouristsUserComp;