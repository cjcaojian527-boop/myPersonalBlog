import { create } from 'zustand';
import { ELEMNTTYPE } from '@utils/const';




export const useContextList = create((set, get) => ({
    ColumnList: [
        {
            label: '内容标题',
            name: 'label',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入内容标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '内容作者',
            name: 'name',
            hidden: false,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '输入内容作者',
                    showSearch: {
                        optionFilterProp: 'label',
                        autoClearSearchValue: false,
                        filterOption: false,
                    },
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    // options: [],
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '绑定文章',
            name: 'articleId',
            hidden: false,
            // rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '选择绑定文章',
                    showSearch: {
                        optionFilterProp: 'label',
                        autoClearSearchValue: false,
                        filterOption: false,
                    },
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    // options: [],
                    size: 'middle',
                    // mode: "multiple",
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

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
            title: '文章作者',
            dataIndex: 'userId',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                return React.createElement(Tag, { color: '#e46a18' }, row.userId_display);
            }`

        },
        {
            title: '文章标题',
            dataIndex: 'title',
            width: 120,
            align: 'center',
            ellipsis: true
        },
        {
            title: '文章分类',
            dataIndex: 'articleType',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                return React.createElement(Tag, { color: '#b418e4' }, row.articleType_display);
            }`
        },
        {
            title: '关联标签',
            dataIndex: 'Labels',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                if (!row.Labels.length) {
                  return  React.createElement(Tag, { color: 'red' }, '未关联');
                }
                return React.createElement(Space, { size: 2, wrap: true },
                    ...row.Labels.map((child, i) =>
                        React.createElement(Tag, { color: '#18e4a7', key: i + 1 }, child.labelName)
                    )
                );
            }`
        },
    ],
    getadddrawerForm: (ColumnList, filterList = ['labelId']) => {
        ColumnList = ColumnList || get()['ColumnList'];
        return ColumnList.map(m => {
            const obj = { ...m };
            if (!filterList.includes(m.name)) {
                obj.rules = [{ required: true, message: '必填' }];
            }

            return obj;
        }).filter(f => f.name !== 'createdAt');
    },
    CheckboxMap: {},
    setVale: (key, val) => setVale(key, val, set, get)

}));

const setVale = (key, val, set, get) => {
    try {
        set({ [key]: val });
    } catch (error) {
        console.error('setVale失败：', error);
    }

}
// export const Checkbox = create((set, get) => ({}));

export const useContextForm = create((set, get) => ({
    formList: [
        {
            label: '绑定文章',
            name: 'articleId',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择绑定文章',
                    showSearch: { optionFilterProp: 'label' },
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: [],
                    size: 'middle',
                    // mode: "multiple",
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '文章作者',
            name: 'name',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '输入内容作者',
                    allowClear: true,
                    disabled: true,
                    style: { width: 200 },
                    options: [],
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '内容标题',
            name: 'label',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input.TextArea',
                renderProps: {
                    placeholder: '输入内容标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

        {
            label: '内容顺序',
            name: 'order',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'InputNumber',
                renderProps: {
                    placeholder: '输入内容顺序',
                    min: 1,
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },

                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '元素类型',
            name: 'elementType',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择元素类型',
                    allowClear: true,
                    showSearch: { optionFilterProp: 'label' },
                    disabled: false,
                    style: { width: 200 },
                    options: Object.entries(ELEMNTTYPE).map(([label, value]) => ({
                        key: label,
                        label,
                        value
                    })),
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '元素内容',
            name: 'content',
            hidden: false,
            rules: [{ required: true, message: '必填' }],
            editer: {
                element: 'Input.TextArea',
                renderProps: {
                    placeholder: '具体内容',
                    allowClear: true,
                    disabled: false,
                    // style: { width: 200 },

                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

    ],


    getadddrawerForm: (ColumnList, filterList = ['labelId']) => {
        ColumnList = ColumnList || get()['ColumnList'];
        return ColumnList.map(m => {
            const obj = { ...m };
            if (!filterList.includes(m.name)) {
                obj.rules = [{ required: true, message: '必填' }];
            }

            return obj;
        }).filter(f => f.name !== 'createdAt');
    },
}));
