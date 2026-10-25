import React from 'react';
import { Button, Tag, Space, Image, Avatar } from 'antd';
import { FILE_BASEURI } from '@utils/const';
import { deepClone, formatDate, maskRandomly } from '@utils/utils';
import { suorceMenus } from '@/router';
import { commentStatus, roleOptions } from '@utils/const';
import { iconMap } from '@/components/Menu';
import { useAuthStore } from '@/store';
import imgError from '@assets/imgerror.png';


export const _indexData = { title: 'No.', width: 70, dataIndex: "_index", align: 'center', };

export const _actionData = {
    title: '基本操作',
    width: 300,
    fixed: 'end',
    align: 'center',
    dataIndex: "Action"
};


// ── render 字符串的「可用作用域」白名单 ────────────────────────────────
// models/ 里把 render 写成字符串，运行时再编译成函数，它引用的变量（Tag、formatDate…）
// 全都来自本模块顶部的 import。原先用 eval 编译 —— 直接 eval 走的是本模块的词法作用域，
// 所以拿得到这些变量。但打包器不认这套，两记闷棍一起打下来：
//   ① tree-shaking：这些 import 没有任何「静态可见」的引用，整条被删
//   ② 变量重命名：就算留着，也被压成 x/y/z，eval 里的原名照样找不到
// 症状就是「开发环境一切正常，一打包就报 ReferenceError: Tag is not defined」。
//
// 解法：把作用域显式登记成对象，改用 new Function 注入 —— 全是静态引用，
//       打包器看得见、删不掉，变量重命名也伤不到（参数名由我们定）。
// ⚠️ 以后 render 里要用新变量，必须在此登记，否则运行时报 "xxx is not defined"
const RENDER_SCOPE = {
    React,
    // antd 组件
    Button, Tag, Space, Image, Avatar,
    // 常量
    FILE_BASEURI, commentStatus, roleOptions,
    // 工具函数
    deepClone, formatDate, maskRandomly,
    // 菜单与图片兜底
    suorceMenus, iconMap, imgError,
};

const RENDER_KEYS = Object.keys(RENDER_SCOPE);
const RENDER_VALUES = RENDER_KEYS.map(k => RENDER_SCOPE[k]);

// 同一段 render 字符串每次 initTable 都重新编译太亏，编译一次缓存复用。
// auth 是「动态作用域」：它会随登录 / 登出被整体替换，所以不能塞进模块级的 RENDER_SCOPE
// （模块加载时只会取到一次空对象）。这里把它作为额外参数注入，并让缓存记住编译时用的
// auth 引用 —— 引用一变就重编译，避免 A 用户登录后 B 用户命中 A 的缓存导致判断串号。
const renderCache = new Map(); // Map<code, { auth, fn }>
const compileRender = (code, auth) => {
    const hit = renderCache.get(code);
    if (hit && hit.auth === auth) return hit.fn;
    // new Function 的函数体在全局作用域执行，拿不到闭包变量，所以必须显式传参；
    // 好处是参数名不受压缩影响，且 RENDER_SCOPE 构成静态引用，依赖不会被摇掉
    const fn = new Function(...RENDER_KEYS, 'auth', `return (${code})`)(...RENDER_VALUES, auth);
    renderCache.set(code, { auth, fn });
    return fn;
};

export const initTable = (columns, data, rowBtns, btnHandClick) => {
    // const merge = [];
    columns = [_indexData, ...deepClone(columns)];
    const auth = useAuthStore.getState().auth;
    if (columns && columns.length) {
        columns.forEach(f => {
            if (f.render && Object.prototype.toString.call(f.render) === '[object String]') {
                try {
                    f.render = compileRender(f.render, auth);
                } catch (error) {
                    delete f.render;
                    console.warn('initable出错：', error);
                }
            }
        });
        // 用展开创建新对象，而不是 Object.assign(_actionData, ...) 原地改：
        // 模块级 _actionData 是多张表格共享的，原地写入会让后一次 initTable 的
        // render / btnHandClick 覆盖掉前一张表，导致按钮行为串台。
        columns.push(Object.assign({}, _actionData, {
            render: (_, row) => (
                <Space size="medium">
                    {rowBtns.map(({ text, action = '', ...btn }, i) => (<Button {...btn} onClick={() => btnHandClick({ row, btn, action }, 'row')} key={i + 1}>{text || 'testBtn'}</Button>))}

                </Space>
            ),
        }));
    }
    if (data && data.length) {
        data = deepClone(data).map((m, i) => {
            const obj = {
                ...m,
                _index: i + 1,
                key: i + 1
            };
            // if (rowBtns && rowBtns.length) {
            //     obj.Action = "";
            // }
            return obj;
        });
    }


    return [columns, data];

}