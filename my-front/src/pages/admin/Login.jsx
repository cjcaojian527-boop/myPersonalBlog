import React, { useState, useEffect, useRef } from 'react';
import { LockOutlined, UserOutlined, SignatureOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input, App, Space, Avatar } from 'antd';
import './scss/login';
import { useAuthStore } from '@/store';
import DateTimeWeather from '@/components/DateTimeWeather';
import { usernameRules, passwordRules } from '@utils/const';
import { getBackgroundByWeather } from '@utils/utils';
import { FILE_BASEURI, BASEURI } from '@utils/const';
import { useNavigate } from 'react-router-dom';
import { postRequest, getRequest } from '@utils/api';

const LoginComp = (props) => {

    const { message: messageApi } = App.useApp();
    const navigate = useNavigate();
    const [loading, set_loading] = useState(false);
    const [SVG, set_SVG] = useState({});
    const [form] = Form.useForm();

    const { setVale, auth } = useAuthStore.getState();
    const Timer = useRef(null);
    const [AvatarSRC, set_AvatarSRC] = useState(auth.avatar || null);

    // 背景 - 根据当前时间自动设置
    const bgStyle = (() => {
        const hour = new Date().getHours();
        return getBackgroundByWeather('113', hour);
    })();

    const onFinish = async values => {
        // console.log('Received values of form: ', values);

        const resp = await postRequest("/api/auth/verifyCode", { code: values.code, captchaId: SVG.captchaId });
        console.log(resp);
        if (resp.code !== 0) {
            messageApi.open({ type: 'error', content: resp.message });
            getCaptchaCode();
            form.resetFields(['code']);
            return;
        } else messageApi.open({ type: 'success', content: resp.message });

        set_loading(true);
        const { code, errors, message, data } = await postRequest("/api/auth/Login", values);
        set_loading(false);

        if (code !== 0) {
            // form.resetFields(['code', 'name', 'password']);
            if (errors && errors.length) {
                const msg = errors.map(m => m.msg).join();
                messageApi.open({ type: 'error', content: msg });
            }
            if (message) messageApi.open({ type: 'error', content: message });
            getCaptchaCode();
            return;
        }

        const users = {};
        if (values.remember) {
            users['remember'] = values.remember;
        }
        setVale('auth', { ...users, ...data, password_display: values.password });
        messageApi.open({ type: 'success', content: message });
        // navigate('/admin?message=' + message, { replace: true });
        setTimeout(() => {
            location.replace(BASEURI + '/admin?message=' + message);
        }, 500);
    };


    const getCaptchaCode = async () => {
        const { code, data } = await getRequest("/api/auth/getCaptchaCode");
        // console.log(data);
        if (code == 0) {
            set_SVG(data);
        }
    }

    const CheckboxChange = e => {
        // console.log(e.target.checked);
        // if (e.target.checked === false) {
        //     setVale('auth', {});
        // }
    }

    const queryUsers = async (name) => {

        const usersResp = await postRequest("/api/auth/queryUsers", { formData: { name }, pageSize: 100 });
        // console.log(resp);
        if (usersResp.code == 0 && usersResp.data?.list?.length) {
            return usersResp.data.list;
        }

        return [];
    }

    const ValuesChange = ({ name }) => {

        clearTimeout(Timer.current);
        Timer.current = setTimeout(() => {
            // console.log(name);
            if (name !== undefined) {
                if (name == '') {
                    set_AvatarSRC(null);
                    return;
                }

                // queryUsers(name).then(list => {
                //     const item = list.find(f => f.name === name);
                //     if (item?.avatar) {
                //         set_AvatarSRC(item?.avatar);
                //     }else{
                //          set_AvatarSRC(null);
                //     }
                // });
            }
        }, 500);
    }

    useEffect(() => {
        getCaptchaCode();
        console.log('Login_auth:', auth);
    }, []);

    return (
        <div className="login-container" style={{ background: bgStyle }}>

            {/* 背景装饰 - 云朵 */}
            <div className="login-bg">
                <div className="login-cloud login-cloud-1"></div>
                <div className="login-cloud login-cloud-2"></div>
                <div className="login-cloud login-cloud-3"></div>
                <div className="login-cloud login-cloud-4"></div>
                <div className="login-cloud login-cloud-5"></div>
            </div>

            {/* 日期时间天气 */}
            <DateTimeWeather />

            {/* 表单区域 - 纸张（带锯齿边缘） */}
            <div className="login-toilet-paper">
                <div className="tp-paper">
                    <div className="tp-paper-content">
                        {/* 这里放主人的表单 */}
                        <div style={{ marginBottom: 14, textAlign: 'left' }}>System Login</div>
                        <Avatar style={{ marginBottom: 14, boxShadow: '0 0 4px 2px #0000002e' }} size={64} src={AvatarSRC ? FILE_BASEURI + AvatarSRC : null} icon={AvatarSRC ? null : <UserOutlined />} />
                        <Form
                            name="login"
                            form={form}
                            initialValues={{ remember: !!auth.remember, name: auth.remember ? auth.name : '', password: auth.remember ? auth.password_display : '' }}
                            style={{ maxWidth: 360 }}
                            onValuesChange={ValuesChange}
                            onFinish={onFinish}
                        >

                            <Form.Item
                                name="name"
                                rules={usernameRules}
                            >
                                <Input prefix={<UserOutlined />} placeholder="Username" allowClear />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={passwordRules}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Password" allowClear />
                            </Form.Item>
                            <Form.Item
                                name="code"
                                rules={[{ required: true, message: '请输入验证码' }]}
                            >
                                <Space>
                                    <Input prefix={<SignatureOutlined />} placeholder="输入验证码" allowClear />
                                    {SVG?.svg ? <span onClick={getCaptchaCode} dangerouslySetInnerHTML={{ __html: SVG.svg }} />
                                        : <Button onClick={getCaptchaCode} style={{ width: 80 }} >
                                            获取
                                        </Button>}

                                </Space>

                            </Form.Item>
                            <Form.Item>
                                <Flex justify="space-between" align="center">
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox onChange={CheckboxChange}>记住用户</Checkbox>
                                    </Form.Item>
                                    <a href="">忘记密码？</a>
                                </Flex>
                            </Form.Item>

                            <Form.Item>
                                <Button block type="primary" htmlType="submit" loading={loading}>
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                    {/* 底部锯齿边缘 */}
                    <div className="tp-paper-edge">
                        <svg viewBox="0 0 320 20" preserveAspectRatio="none">
                            <path d="M0,0 L8,15 L16,0 L24,15 L32,0 L40,15 L48,0 L56,15 L64,0 L72,15 L80,0 L88,15 L96,0 L104,15 L112,0 L120,15 L128,0 L136,15 L144,0 L152,15 L160,0 L168,15 L176,0 L184,15 L192,0 L200,15 L208,0 L216,15 L224,0 L232,15 L240,0 L248,15 L256,0 L264,15 L272,0 L280,15 L288,0 L296,15 L304,0 L312,15 L320,0 L320,20 L0,20 Z" fill="white" />
                        </svg>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default LoginComp;
