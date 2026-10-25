import { create } from 'zustand';

export const useTypes = create((set, get) => ({
    ColumnList: [
        {
            label: '顺序号ID',
            name: 'id',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入顺序号ID',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '类型唯一ID',
            name: 'typeId',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入类型唯一ID',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '文章类型标题',
            name: 'typeName',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入类型标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '创建时间',
            name: 'createdAt',
            hidden: false,
            rules: [],
            editer: {
                element: 'DatePicker.RangePicker',
                renderProps: {
                    placeholder: '输入日期',
                    allowClear: true,
                    disabled: false,
                    style: { width: 230 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        }
    ],
    tableColumns: [
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            ellipsis: true,
            align: 'center',
            width: 150,
            render: `(_, row) => {
               return formatDate(row.createdAt,'YYYY-MM-DD HH:mm:ss');
            }`
        },
        {
            title: '文章类型标题',
            dataIndex: 'typeName',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
         {
            title: '引用文章数量',
            dataIndex: 'ArticleLists',
            width: 120,
            align: 'center',
            ellipsis: true,
             render: `(_, row) => {
               return row.ArticleLists?.length || 0;
            }`
        },
        {
            title: '唯一ID',
            dataIndex: 'typeId',
            width: 120,
            align: 'center',
            ellipsis: true
        },
        {
            title: '顺序号ID',
            dataIndex: 'id',
            width: 120,
            align: 'center',
            ellipsis: true
        },
    ],
    getadddrawerForm: (filterList = ['createdAt', 'typeId', 'id']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = [{ required: true, message: '必填' }];


            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
}));
