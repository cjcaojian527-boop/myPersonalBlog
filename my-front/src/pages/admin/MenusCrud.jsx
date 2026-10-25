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
import { useMenus } from './models/Menus';

const { confirm } = Modal;

const rowBtns = [
    { size: 'small', action: 'viwe', text: '查看菜单', icon: <EyeOutlined /> },
    { type: 'primary', action: 'modify', size: 'small', text: '修改菜单', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除菜单', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增菜单', icon: <PlusCircleOutlined /> },

]


const MenusCrud = () => {

    const { ColumnList: _columnList, tableColumns, getadddrawerForm } = useMenus.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置
    const columnList = resovleFormItem(_columnList);
    // console.log(columnList);


    const searchData = async (queryData = {}) => {
        set_loading(true);
        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const resp = await postRequest("/api/menu/queryMenus", { formData: getFieldsValue(), ...pageInfo, ...queryData });
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
                set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {

            }
        } else {
            if (action == 'add') {


            } else if (action == 'modify') {
                set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {
                confirm({
                    title: '确认删除菜单吗',
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

    const deleteRow = async ({ id }) => {
        const resp = await postRequest("/api/menu/destroyMeun", { id });
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
            const method = action == 'modify' ? 'updateMenu' : 'addMenu';
            const body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.id = data.id;
            }
            const resp = await postRequest("/api/menu/" + method, body);

            if (resp.code == 0 && resp.data) {
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

    const getDrawerData = (action, row) => {
        const itme = { onClose: DrawerClear };
        if (action == 'add') {
            itme.title = '新增菜单';
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
            itme.title = '修改菜单';
            const columnList = resovleFormItem(getadddrawerForm());
            const initialValues = { ...row }
            if (initialValues.display === true) {
                initialValues.display = 1;
            } else initialValues.display = 0;
            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish({ id: row.id }, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {
            itme.title = '查看菜单';
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
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='系统菜单管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default MenusCrud;