import { create } from 'zustand';
import { suorceMenus } from '@/router';

export const useMenus = create((set, get) => ({
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
            title: '菜单标题',
            dataIndex: 'label',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '菜单图标',
            dataIndex: 'icon',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                if (row['icon'] !== undefined && row['icon'].trim().length > 0) {
                    const Icon = iconMap[row['icon']]
                    return React.createElement(React.Fragment, null, null, React.createElement(Icon))
                }else{
                    return '--';
                }
            }`,
        },
        {
            title: '父级菜单',
            dataIndex: 'pid',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                let text, color;
                if (row.pid == -1) {
                    text = '--';
                    color = 'default';
                } else if (suorceMenus.find(f => f.id === row.pid)) {
                    text = suorceMenus.find(f => f.id === row.pid).label;
                    color = 'blue';
                } else {
                    text = '未分配';
                    color = 'red';
                }
                return React.createElement(Tag, { color: color }, text);
            }`

        },
        {
            title: '所包含子菜单',
            dataIndex: 'id',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                const children = suorceMenus.filter(f => f.pid === row.id);
                if (children.length) {
                    return React.createElement(Space, { size: 2, wrap: true },
                        ...children.map((child,i) =>
                            React.createElement(Tag, { color: 'blue', key: i+1 }, child.label)
                        )
                    );
                } else {
                    return React.createElement(Tag, { color: 'red' }, '未分配');
                }
            }`


        },
        {
            title: '路由注册地址',
            dataIndex: 'path',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '组件地址',
            dataIndex: 'componentPath',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '路由访问地址',
            dataIndex: 'absolutePath',
            width: 120,
            align: 'center',
            ellipsis: true,
        },
        {
            title: '层级',
            dataIndex: 'level',
            align: 'center',
            width: 90
        },
        {
            title: '是否禁用',
            dataIndex: 'display',
            align: 'center',
            width: 90,
            render: `(_, row) => row.display ==true ? '否' : '是'`
        },
    ],
    getadddrawerForm: () => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            if (!['pid', 'icon'].includes(m.name)) {
                obj.rules = [{ required: true, message: '必填' }];
            }

            return obj;
        }).filter(f => f.name !== 'createdAt' && f.name !== 'id');
    },
    ColumnList: [
        {
            label: '菜单标题',
            name: 'label',
            hidden: false,
            rules: [],
            // labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入菜单标题',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '菜单图标',
            name: 'icon',
            hidden: false,
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '参照@ant-design/icons图标',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '父级菜单',
            name: 'pid',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择菜单',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: suorceMenus.filter(f => f.display).map(m => ({ label: m.label, value: m.id })),
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '所包含子菜单',
            name: 'id',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择菜单',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: suorceMenus.map(m => ({ label: m.label, value: m.id })),
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '路由注册地址',
            name: 'path',
            hidden: false,
            //   labelCol: { span: 6 },
            // wrapperCol: { span: 18 },
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '填写相对路径或者绝对路径',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '组件地址',
            name: 'componentPath',
            hidden: false,
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '填写组件地址',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '路由访问地址',
            name: 'absolutePath',
            hidden: false,
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '填写路由访问地址',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '层级',
            name: 'level',
            hidden: false,
            rules: [],
            editer: {
                element: 'InputNumber',
                renderProps: {
                    placeholder: '输入层级',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    min: 1,
                    max: 2,
                    keyboard: true,
                    mode: 'spinner',
                    size: 'medium',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '是否禁用菜单',
            name: 'display',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择是否',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: [
                        { value: 1, label: '否' },
                        { value: 0, label: '是' }
                    ],
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

}));
