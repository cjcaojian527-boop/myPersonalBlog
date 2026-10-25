import React, { useState } from 'react';
import { Button, Form, Input, Radio, Select, DatePicker, InputNumber, Upload, Switch } from 'antd';
import DebounceSelect from '@/views/antd/DebounceSelect';
import ImgCropUpload from '@/views/antd/ImgCropUpload';





// 表单组件注册表：字符串 → 组件
// ⚠️ 必须显式登记！打包器只认静态引用，原先用 eval 动态取值的组件会被 tree-shaking 删掉，
//    症状就是"开发环境一切正常，一打包就报 ReferenceError: xxx is not defined"
export const FORM_COMPONENTS = {
    Input,
    'Input.TextArea': Input.TextArea,
    Select,
    DatePicker,
    'DatePicker.RangePicker': DatePicker.RangePicker,
    InputNumber,
    Switch,
    Radio,
    'Radio.Group': Radio.Group,
    Upload,
    DebounceSelect,
    ImgCropUpload,
};

// 这些组件不认识某些"表单控件通用属性"（多是从 Input 配置复制过来的），
// 原样透传会一路落到 DOM 上，触发 React 的 "does not recognize the prop" 警告
const UNSUPPORTED_PROPS= {
    Switch: ['allowClear', 'placeholder', 'prefix'],
    ImgCropUpload: ['allowClear'],   // 它会透传给 <Upload>，Upload 同样不认
    Radio: ['allowClear', 'placeholder'],
    'Radio.Group': ['allowClear', 'placeholder'],
};

export const resovleFormItem = (ColumnList = []) => {
    if (ColumnList.length == 0) return [];
    return ColumnList.map(m => {
        let editer = null;
        try {
            // 从注册表查表，而不是 eval 求值：
            // 显式引用才能让打包器知道"这个组件被用到了"，从而在 tree-shaking 中保留它
            const Comp = FORM_COMPONENTS[m.editer.element.trim()];
            if (!Comp) throw new Error(`未注册的表单组件: "${m.editer.element}"，请在 FORM_COMPONENTS 中登记`);
            const renderProps = { ...m.editer.renderProps };
            // 剔掉该组件不认识的属性
            const blocked = UNSUPPORTED_PROPS[m.editer.element];
            if (blocked) blocked.forEach(k => delete renderProps[k]);
            editer = <Comp {...renderProps} />;
        } catch (error) {
            console.error('表单组件加载失败:', error);
            editer = <Input {...m.editer.renderProps} />;
        }
        // 返回 Form.Item 的配置 + 渲染好的编辑器
        return {
            label: m.label,
            name: m.name,
            rules: m.rules,
            hidden: m.hidden,
            editer,  // 渲染好的 JSX 元素
        };

    });


}


