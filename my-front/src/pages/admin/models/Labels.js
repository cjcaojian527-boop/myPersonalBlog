import { create } from 'zustand';

export const useLabels = create((set, get) => ({
    ColumnList: [
        {
            label: '标签标题',
            name: 'labelName',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入标签标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '关联文章',
            name: 'articleId',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择文章',
                    showSearch: { optionFilterProp: 'label' },
                    mode: "multiple",
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: [],
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
            title: '关联文章',
            dataIndex: 'ArticleLists',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                if (!row.ArticleLists.length) {
                  return  React.createElement(Tag, { color: 'red' }, '未关联');
                }
                return React.createElement(Space, { size: 2, wrap: true },
                    ...row.ArticleLists.map((child, i) =>
                        React.createElement(Tag, { color: '#6c58db', key: i + 1 }, child.title)
                    )
                );
            }`
        },
        {
            title: '标签标题',
            dataIndex: 'labelName',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
    ],
    getadddrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = [{ required: true, message: '必填' }];


            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
}));
