import { create } from 'zustand';
// import { suorceMenus } from '@/router';
import { postRequest } from '@utils/api';
import { commentStatus } from '@utils/const';
import { Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export const useComments = create((set, get) => ({
    ColumnList: [
        {
            label: '博主',
            name: 'name',
            hidden: false,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '输入博主账号',
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
                    async fetchOptions(name) {
                        if (name === '') return [];
                        const usersResp = await postRequest("/api/auth/queryUsers", { formData: { name }, pageSize: 100 });
                        // console.log(resp);
                        if (usersResp.code == 0 && usersResp.data?.list?.length) {
                            return usersResp.data.list.map(({ id: value, name: label }) => ({ value: value + '', label }));
                        }

                        return [];
                    }
                }
            }
        },
        {
            label: '游客',
            name: 'tId',
            hidden: false,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '输入游客昵称',
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
                    async fetchOptions(nickName) {
                        if (nickName === '') return [];
                        const resp = await postRequest("/api/touristsAuth/queryUsers", { formData: { nickName } });
                        // console.log(resp);
                        if (resp.code == 0 && resp.data?.list?.length) {
                            return resp.data.list.map(({ id: value, nickName: label }) => ({ value, label }));
                        }
                        return [];
                    }
                }
            }
        },
        {

            label: '文章',
            name: 'articleId',
            hidden: false,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '输入文章标题',
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
                    async fetchOptions(title) {
                        if (title === '') return [];
                        const resp = await postRequest("/api/artcle/getList", { formData: { title } });
                        // console.log(resp);
                        if (resp.code == 0 && resp.data?.list?.length) {
                            return resp.data.list.map(({ id: value, title: label }) => ({ value, label }));
                        }
                        return [];
                    }
                }
            }
        },

        {

            label: '回复评论',
            name: 'Commentobject_id',
            hidden: false,
            rules: [],
            editer: {
                element: 'DebounceSelect',
                renderProps: {
                    placeholder: '输入评论内容',
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
                    async fetchOptions(context) {
                        if (context === '') return [];
                        const resp = await postRequest("/api/comment/getComment", { formData: { context } });
                        // console.log(resp);
                        if (resp.code == 0 && resp.data?.list?.length) {
                            return resp.data.list.map(({ id: value, context: label }) => ({ value, label }));
                        }
                        return [];
                    }
                }
            }
        },
        {
            label: '评论内容',
            name: 'context',
            hidden: false,
            rules: [],
            editer: {
                element: 'Input',
                renderProps: {
                    placeholder: '输入评论内容',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    size: 'middle',
                    // prefix:'',	//带有前缀图标的 input
                }
            }
        },
        {
            label: '审核状态',
            name: 'CommentStatus',
            hidden: false,
            rules: [],
            editer: {
                element: 'Select',
                renderProps: {
                    placeholder: '选择审核状态',
                    allowClear: true,
                    disabled: false,
                    style: { width: 200 },
                    options: commentStatus,
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
            title: '游客',
            dataIndex: 'tId',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                if (!row.Tourist) {
                  return  React.createElement(Tag, { color: 'red' }, '未关联');
                }
                return React.createElement(Tag, { color: '#2c93e6' }, row.Tourist.nickName)
            }`
        },
        {
            title: '本人发表',
            dataIndex: 'uId',
            width: 100,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                 if(row.tId==null && row.uId==auth.id){
                 return '是'}else return '不是'
            }`
        },
        {
            title: '文章',
            dataIndex: 'articleId',
            width: 120,
            align: 'center',
            ellipsis: true,
            render: `(_, row) => {
                if (!row.ArticleList) {
                  return  React.createElement(Tag, { color: 'red' }, '未关联');
                }
                return React.createElement(Tag, { color: '#db58b2' }, row.ArticleList.title)
            }`
        },
        {
            title: '内容',
            dataIndex: 'context',
            width: 120,
            align: 'center',
            ellipsis: true,
        },

        {
            title: '点赞量',
            dataIndex: 'likes',
            width: 120,
            align: 'center',
            ellipsis: true,

        },
        {
            title: '状态',
            dataIndex: 'CommentStatus',
            width: 120,
            align: 'center',
            render: `(_, row) => {
                const map = {
                    pending: { color: 'orange' },
                    approved: { color: 'green' },
                    rejected: { color: 'red' }
                };
                const { color } = map[row.CommentStatus] || map.pending;
                const text = commentStatus.find(f => f.value == row.CommentStatus)?.label || '--';
                return React.createElement(Tag, { color }, text)
            }`
        },
        {
            title: 'IP属地',
            dataIndex: 'ClientIp',
            width: 120,
            align: 'center',
            ellipsis: true,

        },
    ],
    getadddrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            if (obj.name.includes('Commentobject_')) {
                obj.rules = [];
            }
            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
    getupdatedrawerForm: (filterList = ['createdAt']) => {
        return get()['ColumnList'].map(m => {
            const obj = { ...m };
            obj.rules = obj.rules.length ? obj.rules : [{ required: true, message: '必填' }];
            return obj;
        }).filter(f => !filterList.includes(f.name));
    },
}));