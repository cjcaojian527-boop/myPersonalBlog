import { create } from 'zustand';

export const useArticleList = create((set, get) => ({
    ColumnList: [
        {
            label: '文章标题',
            name: 'title',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入文章标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '文章分类',
            name: 'articleType',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Select',
                renderProps: {
                    showSearch: { optionFilterProp: 'label' },
                    // mode: "multiple",
                    placeholder: '选择文章分类',
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
            label: '文章作者',
            name: 'userId',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择文章作者',
                    showSearch: { optionFilterProp: 'label' },
                    // mode: "multiple",
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
            label: '绑定标签',
            name: 'labelId',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择标签',
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
        },
        {
            label: '文章封面',
            name: 'coverImage',
            hidden: true,
            rules: [],
            editer: {
                element: 'ImgCropUpload',
                renderProps: {
                    placeholder: '上传封面图',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    maxCount: 1,
                    customRequest: ({ file, onSuccess }) => onSuccess({}, file),
                    ImgCrop: {
                        aspect: '9 / 16',//1
                        cropShape: "rect",//round

                    }

                }
            }
        },
        {
            label: '点赞量',
            name: 'likes',
            hidden: true,
            rules: [],
            editer: {
                element: 'InputNumber',
                renderProps: {
                    placeholder: '输入点赞量',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    min: 0,
                    keyboard: true,
                    mode: 'spinner',
                    size: 'medium',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '是否置顶',
            name: 'isTop',
            hidden: false,
            rules: [],
            editer: {
                element: 'Switch',
                renderProps: {
                    allowClear: true,
                    disabled: false,
                    // style: { width: 200 },

                    size: 'medium',
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
            title: '文章封面',
            dataIndex: 'coverImage',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                if (row.coverImage) {
                    return React.createElement(Image, { src: FILE_BASEURI + row.coverImage, fallback:imgError,width: 70 }, null);
                }
                return '--';
            }`
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
        {
            title: '是否置顶',
            dataIndex: 'isTop',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                return row.isTop ? '是' : '否';
            }`
        },
        {
            title: '点赞量',
            dataIndex: 'likes',
            width: 100,
            align: 'center',
            ellipsis: true,

        },
    ],
    getadddrawerForm: (ColumnList, filterList = ['labelId', 'isTop', 'likes'], hides = []) => {
        ColumnList = ColumnList || get()['ColumnList'];
        return ColumnList.map(m => {
            const obj = { ...m };
            if (!filterList.includes(m.name)) {
                obj.rules = [{ required: true, message: '必填' }];
            }
            if (['coverImage', 'likes'].includes(m.name)) {
                obj.hidden = false;
            }
            if (hides.includes(m.name)) {
                obj.hidden = true;
            }

            return obj;
        }).filter(f => f.name !== 'createdAt');
    },
}));
