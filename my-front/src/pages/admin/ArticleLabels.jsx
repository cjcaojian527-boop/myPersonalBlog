import React, { useState, useEffect, useRef } from 'react';
import { PlusCircleOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import FormComp from '@views/antd/form';
import TableComp from '@views/antd/table';
import DrawerComp from '@views/antd/Drawer';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import './scss/MenusCrud';
import { postRequest } from '@utils/api';
import { deepClone } from '@utils/utils';
import { useLabels } from './models/Labels';

const { confirm } = Modal;

const rowBtns = [
    { type: 'primary', action: 'modify', size: 'small', text: '修改标签', color: '#ffc14dea', icon: <EditOutlined /> },
    { type: 'primary', action: 'delete', size: 'small', text: '删除标签', danger: true, icon: <DeleteOutlined /> },
];
const btns = [
    { type: 'primary', action: 'add', size: 'small', text: '新增标签', icon: <PlusCircleOutlined /> },

]


const ArticleLabelsComp = () => {

    const { ColumnList: _columnList, tableColumns, getadddrawerForm } = useLabels.getState();
    const { message: messageApi } = App.useApp();
    const [DrawerData, set_DrawerData] = useState({});
    const formRef = useRef(null);
    const drawerformRef = useRef(null);
    const [tableData, set_tableData] = useState([]);
    const [loading, set_loading] = useState(false);
    const [total, setTotal] = useState(10);
    const [pageInfo, set_pageInfo] = useState({ page: 1, pageSize: 10 }); // 分页配置
    // const columnList = resovleFormItem(_columnList);
    const [columnList, set_columnList] = useState(_columnList);
    // console.log(columnList);


    const searchData = async (queryData = {}) => {
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
        const resp = await postRequest("/api/labels/getLabels", { formData, ...pageInfo, ...queryData });
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
            if (action == 'add') {


            } else if (action == 'modify') {
                set_DrawerData(getDrawerData(action, row))
            } else if (action == 'delete') {
                confirm({
                    title: '确认删除文章标签吗',
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

    const deleteRow = async ({ labelId }) => {
        if (!labelId) return;
        const resp = await postRequest("/api/labels/destroyLabels", { labelId });
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
            const method = action == 'modify' ? 'updateLabels' : 'addLabels';
            const body = { ...getFieldsValue() };
            if (action == 'modify') {
                body.labelId = data.labelId;
            }
            const resp = await postRequest("/api/labels/" + method, body);

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
            itme.title = '新增文章标签';
            // console.log(getadddrawerForm())

            const columnList = resovleFormItem(getadddrawerForm(['createdAt', 'articleId']));
            const initialValues = {}
            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={DrawerDataSubmit}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={(obj) => DrawerFinish(obj, 'add')} columnList={columnList} />



        } else if (action == 'modify') {
            itme.title = '修改文章标签';
            const columnList = resovleFormItem(getadddrawerForm(['createdAt', 'articleId']));
            const initialValues = { ...row }

            itme.children = <FormComp ref={drawerformRef}
                children={<><Button type="primary" onClick={() => DrawerDataSubmit(action)}>保 存</Button><Button onClick={DrawerClear}>取 消</Button></>}
                initialValues={initialValues} onFinish={() => DrawerFinish({ labelId: row.labelId }, 'modify')} columnList={columnList} />

        } else if (action == 'delete') {

        } else {

        }
        itme.open = true;
        return itme;

    }
    useEffect(() => {
        let _List = deepClone(_columnList);
        const requestList = [
            postRequest("/api/artcle/getList", { formData: {}, pageSize: 100 }),
        ];
        Promise.all(requestList).then(([resp]) => {
            set_loading(false);
            if (resp.code == 0 && resp.data?.list?.length) {
                _List[1].editer.renderProps.options = resp.data.list.map(({ id: value, title: label }) => ({ value, label }));
            }

            // console.log(labelResp);
            set_columnList(() => {
                // console.log("_List:", _List);
                searchData();
                return _List;
            });
        });

    }, []);




    return (<div className='MenusCrud-contenier'>
        <div className='MenusCrud-form'>
            <FormComp ref={formRef} onFinish={searchData} columnList={resovleFormItem(columnList)}  ></FormComp>
        </div>
        <div className='MenusCrud-table'>
            <TableComp columns={tableColumns} total={total} tableData={tableData} title='文章标签管理' btns={btns}
                loading={loading} pageChange={pageChange}
                rowBtns={rowBtns} btnHandClick={btnHandClick}></TableComp>
        </div>
        <DrawerComp {...DrawerData}></DrawerComp>

    </div>);

}
export default ArticleLabelsComp;