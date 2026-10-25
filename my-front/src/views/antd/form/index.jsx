import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Button, Form, Input, Radio, ConfigProvider } from 'antd';
import 'dayjs/locale/zh-cn';
import '../scss/FormComp';




const FormComp = forwardRef((_props, ref) => {
    const props = { ...defaultProps, ..._props };
    // useImperativeHandle 允许父组件通过 ref 访问子组件内部定义的方法或属性

    const {
        formLayout,
        name,
        initialValues,
        columnList,
        styles,
        ValuesChange, onFinish, disabled,
        children, customContenier
    } = props;
    // console.log('表单props:', props);

    const [form] = Form.useForm();
    // console.log("form:", form);
    // const isFormTouched = form.isFieldsTouched();

    try {
        useImperativeHandle(ref, () => ({
            // 暴露给父组件的方法
            form
        }));

    } catch (error) {
        console.error("useImperativeHandle:", error);

    }


    const resetFields = () => {
        if (props.resetFields && Object.prototype.toString.call(props.resetFields) === `[object Function]`) {
            props.resetFields();
        } else {
            form.resetFields();
        }

    }
    const submit = () => {
        if (props.submit && Object.prototype.toString.call(props.submit) === `[object Function]`) {
            props.submit();
        } else {
            form.submit();
        }
    }





    return (
        <div className='Form_div' style={styles}>

            <Form
                layout={formLayout}
                form={form}
                initialValues={initialValues}
                name={name}
                disabled={disabled}
                onValuesChange={ValuesChange}
                onFinish={() => onFinish()}

            >
                {columnList.length ? columnList.map(({ editer, ...item }, i) => <Form.Item  {...item} key={i + 1}>{editer}</Form.Item>) : null}


            </Form>
            {!!customContenier && <div className='customContenier'>
                {customContenier}
            </div>}

            <div className='btns'>
                {children ? children : (<><Button type="primary" onClick={submit}>查 询</Button><Button onClick={resetFields}>重 置</Button></>)}
            </div>
        </div>
    );
});

const defaultProps = {
    formLayout: 'inline',
    name: 'form_' + Date.now(),
    initialValues: {},
    columnList: [],
    ValuesChange: data => console.log("ValuesChange:", data),
    onFinish: data => console.log("收集表单数据:", data),
    children: null,
    disabled: false,
    customContenier: null,
    styles: {
        // boxShadow: 'unset',
        // padding: '0px 10px',
        // borderLeft: '2px double #ececec',
        // borderRight: '2px double #ececec',
        // borderRadius: 0
    },
}



export default FormComp;