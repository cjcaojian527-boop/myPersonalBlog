import { create } from 'zustand';
import { roleOptions } from '@/utils/const';

export const useUsers = create((set, get) => ({
    ColumnList: [
        {
            label: '用户账号',
            name: 'name',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入用户账号',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '角色',
            name: 'role',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择角色',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: roleOptions,
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },

        {
            label: '用户密码',
            name: 'password',
            hidden: true,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入密码',
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
            label: '用户别名',
            name: 'name_display',
            hidden: false,
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入用户名',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '个人描述',
            name: 'describe',
            hidden: true,
            rules: [],
            editer: {
                element: 'Input.TextArea',
                renderProps: {
                    placeholder: '描述内容',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
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
            title: '用户账号',
            dataIndex: 'name',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '角色',
            dataIndex: 'role',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
               return roleOptions.find(f=>f.value===row.role).label;
            }`
        },
        {
            title: '系统账号',
            dataIndex: 'isSystem',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
               return row.isSystem ? '是' : '否';
            }`
        },
        {
            title: '用户别名',
            dataIndex: 'name_display',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
               return row.name_display || '--';
            }`
        },
        {
            title: '用户头像',
            dataIndex: 'avatar',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: ` (_, row) => {
                if (row.avatar) {
                    return React.createElement(Image, { src: FILE_BASEURI + row.avatar, fallback:imgError, width: 70 }, null);
                }
                return React.createElement(Avatar, {size:64, icon:React.createElement(iconMap.UserOutlined,null,null ) }, null);
            }`
        },
        {
            title: '用户描述',
            dataIndex: 'describe',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
               return row.describe || '--';
            }`
        },
        {
            title: '用户密码',
            dataIndex: 'password',
            width: 120,
            align: 'center',
            hidden: true,
            ellipsis: true
        },
    ],
    getadddrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            if (['password', 'describe', 'avatar'].includes(obj.name)) {
                obj.hidden = false;
            }
            if (obj.name == 'name') {
                obj.rules = [{ required: true, message: '请输入用户账号' }, { min: 4, message: '账号长度至少为4位' }];
            }
            if (obj.name == 'password') {
                obj.rules = [{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少为6位' }];
            }

            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
    getupdatedrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            if (['describe', 'avatar'].includes(obj.name)) {
                obj.hidden = false;
            }
            if (obj.name == 'name') {
                obj.rules = [{ required: true, message: '请输入用户账号' }, { min: 4, message: '账号长度至少为4位' }];
            }
            if (obj.name == 'password') {
                obj.rules = [{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度至少为6位' }];
            }
            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
}));
