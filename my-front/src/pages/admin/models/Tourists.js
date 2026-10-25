import { create } from 'zustand';
import { suorceMenus } from '@/router';


export const useTourists = create((set, get) => ({
    ColumnList: [
        {
            label: '昵称',
            name: 'nickName',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入用户昵称',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

        {
            label: '邮箱',
            name: 'email',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入邮箱',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
         {
            label: '是否系统账号',
            name: 'isSystem',
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
        {
            label: '是否禁言',
            name: 'isBanned',
            hidden: true,
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
        {
            label: '点赞文章',
            name: 'likeStrings',
            hidden: true,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '选择点赞文章',
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
                    mode: "multiple",
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

        {
            label: '预览文章',
            name: 'viewStrings',
            hidden: true,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '选择预览文章',
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
                    mode: "multiple",
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

        {
            label: '用户头像',
            name: 'avatar',
            hidden: true,
            rules: [],
            editer: {
                element: 'ImgCropUpload',
                renderProps: {
                    placeholder: '上传头像',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    maxCount: 1,
                    customRequest: ({ file, onSuccess }) => onSuccess({}, file),
                    ImgCrop: {
                        aspect: '1 / 1',//1
                        cropShape: "round",//round
                    }

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
            title: '昵称',
            dataIndex: 'nickName',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            width: 120,
            align: 'center',
            ellipsis: true
        },
        {
            title: '游客头像',
            dataIndex: 'avatar',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                if (row.avatar) {
                    return React.createElement(Image, { src: FILE_BASEURI + row.avatar,fallback:imgError, width: 70 }, null);
                }
                return React.createElement(Avatar, {size:64, icon:React.createElement(iconMap.UserOutlined,null,null ) }, null);
            }`
        },
        {
            title: '是否禁言',
            dataIndex: 'isBanned',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                return row.isBanned ? '是' : '否';
            }`
        },
        {
            title: '是否系统账号',
            dataIndex: 'isSystem',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                return row.isSystem ? '是' : '否';
            }`
        },
        {
            title: '点赞文章',
            dataIndex: 'likeStrings',
            width: 120,
            align: 'center',
            ellipsis: true,
            hidden: true,
            render: `(_, row) => {
               return row.likeStrings || '--';
            }`
        },
        {
            title: '预览文章',
            dataIndex: 'viewStrings',
            width: 120,
            align: 'center',
            ellipsis: true,
            hidden: true,
            render: `(_, row) => {
               return row.viewStrings || '--';
            }`
        },
    ],
    getadddrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            if (['likeStrings', 'viewStrings', 'avatar', 'likeStrings', 'isBanned'].includes(obj.name)) {
                obj.hidden = false;
            }
            if (obj.name == 'email') {
                obj.rules = [{ required: true, message: '必填' }, { pattern: /^\w+@\w+\.\w+$/, message: '邮箱格式不正确' }]
            }
            if (obj.name == 'nickName') {
                obj.rules = [{ required: true, message: '必填' }, { min: 6, max: 10, message: '长度在 6-10 个字符' }]
            }
            if (['likeStrings', 'viewStrings', 'collects'].includes(obj.name)) {
                obj.rules = []
            }



            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
    getupdatedrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            if (['likeStrings', 'viewStrings', 'avatar', 'likeStrings', 'isBanned'].includes(obj.name)) {
                obj.hidden = false;
            }
            if (obj.name == 'email') {
                obj.rules = [{ required: true, message: '必填' }, { pattern: /^\w+@\w+\.\w+$/, message: '邮箱格式不正确' }]
            }
            if (obj.name == 'nickName') {
                obj.rules = [{ required: true, message: '必填' }, { min: 6, max: 10, message: '长度在 6-10 个字符' }]
            }
            if (['likeStrings', 'viewStrings', 'collects'].includes(obj.name)) {
                obj.rules = []
            }

            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
}));