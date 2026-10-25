import React, { useState, useEffect, useRef } from 'react';
import { PlusOutlined, UploadOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Image } from 'antd';
import FormComp from '@views/antd/form';
// import TableComp from '@views/antd/table';
import ListComp from '@views/antd/ListComp';
import ArticlePreviewComp from '@views/articlePreview';
import { useNavigate } from 'react-router-dom';
import { resovleFormItem } from '@views/antd/form/form-utils';
import { App, Button, Modal } from 'antd';
import { useLocation } from 'react-router-dom';
import './scss/Context';
import { postRequest, fileRequest, getRequest } from '@utils/api';
import { FILE_BASEURI } from '@utils/const';
import fallbackSRC from '@assets/imgerror.png';
import { deepClone, buildDefaultFileList } from '@utils/utils';
import { useContextList, useContextForm } from './models/Context';


const { confirm } = Modal;
const formStyles = {
    boxShadow: 'unset',
    padding: '0px 10px',
    borderLeft: '2px double #ececec',
    borderRight: '2px double #ececec',
    borderRadius: 0,
    height: ' calc(100% - 30px)'
}

const ContextComp = () => {
    const { message: messageApi } = App.useApp();
    const { ColumnList: columnList, tableColumns, getadddrawerForm, setVale: setCheckbox } = useContextList.getState();
    const navigate = useNavigate();
    const CheckboxMap = useContextList(state => state.CheckboxMap);
    const { formList: _formList } = useContextForm.getState();
    const formRef = useRef(null);
    const formRef2 = useRef(null);
    const articleList = useRef(null);
    const set_currentKey = useRef(null);
    const pageData = useRef({ pageNum: 1, pageSize: 20 });
    const { state: LocationParams } = useLocation();  // state.row


    // const [columnList, set_columnList] = useState(_columnList);
    const [formvisble, set_formvisble] = useState(false);
    const [initialValues, set_initialValues] = useState({});
    const [listData, set_listData] = useState([]);
    const [total, setTotal] = useState(10);
    const [formKey, setFormKey] = useState(0);
    const [contextList, SetcontextList] = useState([]);


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
    const fetchOptions2 = async (name) => {

        const usersResp = await postRequest("/api/auth/queryUsers", { formData: { name }, pageSize: 100 });
        // console.log(resp);
        if (usersResp.code == 0 && usersResp.data?.list?.length) {
            return usersResp.data.list.map(({ id: value, name: label }) => ({ value: value + '', label }));
        }

        return [];
    }

    columnList.find(f => f.name === 'articleId').editer.renderProps['fetchOptions'] = fetchOptions;
    columnList.find(f => f.name === 'name').editer.renderProps['fetchOptions'] = fetchOptions2;

    const [previewImage, setPreviewImage] = useState('');



    const [loading, set_loading] = useState(false);
    const [formList, set_formList] = useState(_formList);








    const searchData = async (queryData = {}) => {

        const { setFieldValue, getFieldsValue, submit } = formRef.current.form;
        // console.log('查询条件：', getFieldsValue());
        const formData = {};
        Object.keys(getFieldsValue()).forEach(key => {
            if (Array.isArray(getFieldsValue()[key]) && !getFieldsValue()[key].length) {
                console.warn(key + ': 数组长度为0');
            } else {
                formData[key] = getFieldsValue()[key];
            }
        });
        // console.log(formData);
        const resp = await postRequest("/api/context/getList", { ...formData, ...pageData.current, ...queryData });
        console.log('searchData查询结果：', resp);
        if (resp.code == 0 && resp.data) {
            setTotal(resp.data.total);
            messageApi.open({ type: 'success', content: resp.message });
            resp.data.list = resp.data.list.map(m => {
                return {
                    ...m,
                    key: m.id,
                }
            });
            set_listData(resp.data.list);

            setPreviewImage('');
            set_formvisble(false);
            set_currentKey.current && set_currentKey.current(-1);

            set_initialValues({});
            SetcontextList([]);
        }

    }
    //新增、修改
    const addAndmodify = async () => {
        const { setFieldValue, getFieldsValue, submit } = formRef2.current.form;
        // console.log('查询条件：', getFieldsValue());
        const formData = new FormData();
        // console.log(getFieldsValue().content);
        const currentType = getFieldsValue().elementType;
        const originalType = initialValues.elementType;
        const fileType = getFieldsValue().content?.file?.type || '';

        // console.log(currentType, originalType, fileType);

        if (originalType?.includes('/') && currentType?.includes('/')) {
            if (originalType !== currentType) {
                if (fileType !== currentType) {
                    messageApi.open({ type: 'error', content: '文件类型已换，请重新上传文件！' });
                    return;
                }

            }
        }
        for (let key in getFieldsValue()) {
            let item = getFieldsValue()[key];

            if (key === 'elementType' && item.includes('/') && Object.prototype.toString.call(getFieldsValue()['content']) === '[object String]') {
                messageApi.open({ type: 'error', content: '请上传文件！' });
                return;
            }

            if (key === 'content') {
                if (item?.fileList?.length) {
                    item = item.fileList[0].originFileObj;

                } else if (Array.isArray(item) && item[0].url) {
                    item = item[0].url;
                }

            }
            // console.log('-------', item);
            formData.append(key, item)
        }
        // console.log(initialValues);
        // return;

        let _url = '/api/context/add';
        if (Object.keys(initialValues).length) {
            //修改
            _url = '/api/context/update';
            formData.append("contextId", initialValues.id);
            if (initialValues.content[0]?.url) {
                formData.append("objectName", initialValues.content[0].url);
            }

        } else {
            //新增

        }
        // return;

        const resp = await fileRequest(_url, formData);
        console.log('表单提交：', resp);
        if (resp.code == 0) {
            messageApi.open({ type: 'success', content: resp.message });
            searchData();
            RowClick({
                ...resp.data,
                articleId: +resp.data.articleId,
                id: +resp.data.id,
                order: +resp.data.order,
            });
            set_currentKey.current && set_currentKey.current(+resp.data.id);

        } else {
            messageApi.open({ type: 'error', content: resp.message });
        }


        // console.log(formData);

    }

    const pageChange = (pageNum, pageSize) => {
        setCheckbox("CheckboxMap", {});
        pageData.current = { pageNum, pageSize };
        searchData(pageData.current);
    }
    const addRow = () => {
        // const { setFieldValue } = formRef2.current.form;
        setPreviewImage('');
        set_formvisble(true);
        set_currentKey.current && set_currentKey.current(-1);

        set_initialValues({});
        setFormKey(prev => prev + 1);
        set_formList(list => {
            const newList = [...list];   // 新数组
            let renderProps = {
                placeholder: '具体内容',
                allowClear: true,
                disabled: false,
                style: { width: 200 },

            }

            const editer = {
                element: 'Input.TextArea',
                renderProps,
            }
            newList[newList.length - 1] = {
                ...newList[newList.length - 1],  // 新对象
                editer,
            };
            return newList;
        });
    }

    const deleteRow = async (fn) => {
        const deleteList = listData.filter(f => CheckboxMap[f.id] === true);
        console.log('deleteList:', deleteList);
        if (fn === 1) {
            if (deleteList.length == 0) return;

            const resp = await getRequest("/api/context/destroy", { contextId: deleteList.map(m => m.id).join('-') });

            console.log(resp);
            if (resp.code == 0) {
                setCheckbox("CheckboxMap", {});
                searchData();
                Clear();
                set_currentKey.current && set_currentKey.current(-1);

                messageApi.open({ type: 'success', content: resp.message });
            } else {
                messageApi.open({ type: 'error', content: resp.message });
            }
            return;
        }
        confirm({
            title: '是否删除勾选的内容？',
            icon: <ExclamationCircleFilled />,
            onOk: () => deleteRow(1),
            onCancel() { },
        });
    }

    const openView = () => {
        const views = deepClone(listData.filter(f => CheckboxMap[f.id] === true));
        console.log('views:', views);
        setPreviewImage('');
        set_formvisble(false);
        set_currentKey.current && set_currentKey.current(-1);

        set_initialValues({});
        SetcontextList([]);
        setTimeout(() => {

            const list = [...views.map(item => {
                if (item.elementType?.includes('/') && item.content) {
                    const file = buildDefaultFileList(item.content);
                    item.content = file;
                }
                item.name = +item.name;
                return item;
            })].reverse();
            SetcontextList(list);
        }, 0);
    }


    const RowClick = (item, set_Key) => {
        if (set_currentKey.current == null && set_Key) {
            set_currentKey.current = set_Key;
        }
        const initVals = { ...item };

        // 文件类型：把 content 从 URL 字符串转成 fileList
        if (initVals.elementType?.includes('/') && initVals.content) {
            const file = buildDefaultFileList(initVals.content);
            initVals.content = file
        }
        initVals.name = +initVals.name;

        set_initialValues(initVals);
        set_formvisble(true);
        console.log('当前row:', initVals);

        setFormKey(prev => prev + 1);
        setTimeout(() => {
            ValuesChange({ elementType: initVals.elementType, content: initVals.content });
            SetcontextList([initVals])
        }, 0);

    }

    const DataSubmit = () => {
        const { submit, isFieldsTouched } = formRef2.current.form;

        if (!isFieldsTouched()) {
            messageApi.open({ type: 'error', content: '未进行操作，无需保存！' });
            return;
        }
        submit();

    }
    const Clear = () => {
        set_formvisble(() => {
            resetFields();
            SetcontextList([]);
            setPreviewImage('');
            return false;
        })
    }


    const resetFields = () => formRef2?.current?.form ? formRef2.current.form.resetFields() : () => { };

    const get_UploadProps = ({ elementType, content }) => {
        let fileList = [];
        if (content !== undefined) {
            if (Object.prototype.toString.call(content) === '[object Array]') {
                fileList = content;
            }
        }
        return {
            name: 'file',
            accept: elementType,
            customRequest: ({ file, onSuccess }) => onSuccess({}, file),
            onChange(info) {
                if (info.file.status !== 'uploading') {
                    // const { getFieldsValue } = formRef2.current.form;
                    console.log(info.file.status, info)
                    if (info.file.status == "removed") {
                        setPreviewImage('')
                        // setFieldValue('content', []);
                        // ValuesChange({ elementType: getFieldsValue().elementType, 'content': [] });
                    }
                    if (info.file.status == "done") {
                        setPreviewImage(URL.createObjectURL(info.file.originFileObj));
                    }
                    // console.log(info.file.status, info);
                }

            },
            size: 'middle',
            maxCount: 1,
            // "fileList": fileList,
            // onPreview: (file) => {
            //     // 自定义行为，比如用 Drawer 预览、Modal 预览等
            //     console.log('点击了文件:', file);
            //     // 想啥也不做就 return
            // },

            children: <Button style={{ width: '100%' }} icon={<UploadOutlined />}>点击上传文件</Button>
        }
    }

    const fileonErrorPreview = (error) => {
        // console.log(error.target)

        error.target.title = `暂不支持${error.target.src.substring(error.target.src.lastIndexOf('.') + 1)}文件预览！`;
        error.target.src = fallbackSRC;

    }

    const topFormChange = (formData) => {
        const { setFieldValue, resetFields } = formRef.current.form;
        // console.log(formData);
        if (formData.articleId !== undefined) {
            resetFields(['label', 'name'])
        }

        if (formData.label !== undefined || formData.name !== undefined) {
            resetFields(['articleId'])
        }

    }

    const ValuesChange = (formData, _flag) => {
        // console.log(formData, _flag);
        const { setFieldValue } = formRef2.current.form;
        if (formData.articleId !== undefined) {
            // console.log(articleList.current)
            const item = articleList.current.find(f => f.id === formData.articleId);
            if (item) {
                // console.log(item)
                setFieldValue("name", item.userId);
                setFieldValue("label", `${item.title}的内容（）`);
            }

        }
        if (formData.elementType !== undefined) {

            let renderProps = {
                placeholder: '具体内容',
                allowClear: true,
                disabled: false,
                style: { width: 200 },

                // multiple:false,
                // prefix:'',	//带有前缀图标的 input
            }
            if (formData.elementType.includes('/')) {
                const item = { ...initialValues, ...formData };

                // console.log(item);
                if (item?.content?.[0]?.url) {
                    setPreviewImage(FILE_BASEURI + item?.content[0]?.url);
                } else {
                    setPreviewImage('')
                }

                Object.assign(renderProps, get_UploadProps(item))
            } else {
                setPreviewImage('');
                if (_flag) {
                    setFieldValue("content", Object.prototype.toString.call(_flag.content) === '[object Array]' ? '' : _flag.content)
                }

            }
            const editer = {
                element: formData.elementType.includes('/') ? 'Upload' : 'Input.TextArea',
                renderProps,
            }
            set_formList(list => {
                const newList = [...list];   // 新数组
                newList[newList.length - 1] = {
                    ...newList[newList.length - 1],  // 新对象
                    editer,
                };
                return newList;
            });
        }

    }

    useEffect(() => {
        let _List = deepClone(_formList);
        const requestList = [
            postRequest("/api/artcle/getList", { formData: {}, pageSize: 100 }),
            postRequest("/api/auth/queryUsers", { formData: {}, pageSize: 100 }),
        ];
        Promise.all(requestList).then(([resp, usersResp]) => {
            set_loading(false);
            if (resp.code == 0 && resp.data?.list?.length) {
                articleList.current = resp.data.list;
                _List[0].editer.renderProps.options = resp.data.list.map(({ id: value, title: label }) => ({ value, label }));
            }
            if (usersResp.code == 0 && usersResp.data?.list?.length) {
                _List[1].editer.renderProps.options = usersResp.data.list.map(({ id: value, name: label }) => ({ value, label }));
            }

            // console.log(labelResp);
            set_formList(() => {
                const querydata = {};
                if (LocationParams?.id !== undefined) {
                    querydata.articleId = LocationParams.id;
                }
                searchData(querydata);
                return _List;
            });
        });
        console.log("LocationParams:", LocationParams);

    }, []);

    useEffect(() => {
        // console.log(CheckboxMap)
    }, [CheckboxMap])


    return (<div className='Context-contenier'>
        <div className='Context-form'>
            <FormComp ref={formRef} onFinish={() => {
                if (LocationParams?.id !== undefined) {
                    navigate(location.pathname, { replace: true, state: null });
                }
                return searchData();
            }} ValuesChange={topFormChange} columnList={resovleFormItem(columnList)}  ></FormComp>
        </div>
        <div className='Context-table'>
            <div className='ListComp'>
                <h3>1、文章内容列表 <PlusOutlined onClick={addRow} title='新增内容' /></h3>
                <ListComp {...{ listData, set_listData, pageChange, total, RowClick, deleteRow, openView, pagination: pageData }} />
            </div>
            <div className='Form-contenier'>
                <h3>2、内容制定详情</h3>
                {formvisble && <FormComp key={formKey} ref={formRef2} formLayout="horizontal"
                    styles={formStyles} onFinish={addAndmodify}
                    ValuesChange={ValuesChange}
                    initialValues={initialValues}
                    customContenier={previewImage ? (
                        <Image
                            width={100}
                            onError={fileonErrorPreview}
                            src={previewImage}
                        />
                    ) : null}
                    columnList={resovleFormItem(formList)}  >
                    <>


                        <Button type="primary" onClick={DataSubmit}>确 定</Button>
                        <Button onClick={resetFields}>重 置</Button>
                        <Button onClick={Clear}>取 消</Button></>
                </FormComp>}
            </div>
            <div className='Form-contenier-view'>
                <h3>3、内容详情预览</h3>
                <div className='Form-contenier-box'>
                    <ArticlePreviewComp Params={LocationParams || {}} contextList={contextList}></ArticlePreviewComp>
                </div>


            </div>
        </div>


    </div>);

}
export default ContextComp;