import React, { useState, useEffect, useRef } from 'react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import FormComp from '@views/antd/form';
import TableComp from '@views/antd/table';
import DrawerComp from '@views/antd/Drawer';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import './scss/MenusCrud';
import { postRequest } from '@utils/api';
// import { alignLabelsByField } from '@utils/utils';
import { useTypes } from './models/Types';
import { suorceMenus } from '@/router';
import { useTabsStore } from '@/store';
import { useNavigate } from 'react-router-dom';
const { confirm } = Modal;

const rowBtns = [
    { size: 'small', action: 'viwe', text: '修改文章', icon: <EyeOutlined /> },
    { type: 'primary', action: 'modify', size: 'small', text: '修改类型', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除类型', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增类型', icon: <PlusCircleOutlined /> },

]


const ArticleTypeComp = () => {

    const { ColumnList: _columnList, tableColumns, getadddrawerForm } = useTypes.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置
    const columnList = resovleFormItem(_columnList);
    const navigate = useNavigate();
    const { addTabs, setVale } = useTabsStore.getState();



    const searchData = async (queryData = {}) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const resp = await postRequest("/api/articleType/queryTypes", { formData: getFieldsValue(), ...pageInfo, ...queryData });
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
                set_DrawerData(getDrawerData(action))
            } else if (action == 'modify') {
                // set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {

            }
        } else {
            if (action == 'viwe') {
                if (!row.ArticleLists?.length) {
                    messageApi.open({ type: 'error', content: '没有引用该类型的文章！' });
                    return;
                }
                const tab = suorceMenus.find(f => f.absolutePath === '/admin/artcle');
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
                    navigate(tab.absolutePath + '?_menu' + Date.now(), { state: { typeId: row.typeId, ArticleLists: row.ArticleLists } })
                } else {
                    messageApi.open({ type: 'error', content: '没有找到文章管理菜单！' });
                }

            } else if (action == 'modify') {
                set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {
                confirm({
                    title: '确认删除文章类型吗',
                    icon: <ExclamationCircleFilled />,
                    onOk: () => deleteRow(row),
                    onCancel() {

                    },
                });

            } else {
                set_DrawerData(getDrawerData(action, row))
            }
        }

    }
    const pageChange = (page, pageSize) => {
        searchData({ page, pageSize });
        set_pageInfo({ page, pageSize });
    }

    const deleteRow = async ({ typeId }) => {
        if (!typeId) return;
        const resp = await postRequest("/api/articleType/destroyType", { typeId });
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
            const method = action == 'modify' ? 'updateType' : 'addType';
            const body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.typeId = data.typeId;
            }
            const resp = await postRequest("/api/articleType/" + method, body);

            if (resp.code == 0) {
                messageApi.open({ type: 'success', content: resp.message });
                searchData();
                // DrawerClear();
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

    const getDrawerData = (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增文章类型';
            // console.log(getadddrawerForm())

            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = {
                icon: 'FileTextOutlined',
                display: 1,
                level: 1,

            }
            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={columnList} />



        } else if (action == 'modify') {
            itme.title = '修改文章类型';
            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = { ...row }

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish({ typeId: row.typeId }, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {

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
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='文章类型管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default ArticleTypeComp;