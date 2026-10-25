import AXIOSAPI from 'axios';
import Qs from 'qs';
import { sm2 } from 'sm-crypto';
import { CONTEXT_PATH, TOKEN_NAME, Tourists_TOKEN_NAME, SM2_PUBLIC_KEY, SM2_CIPHER_MODE, ENCRYPT_PATHS } from './const';
import { useAuthStore } from '@/store';
import { message } from 'antd';
import { useNav } from '@/store';

// 请求拦截器
AXIOSAPI.interceptors.request.use(config => {
    const reg = /^\/static/;
    const { token, TouristsToken } = useAuthStore.getState();

    if (reg.test(config.url)) {

    } else {
        config.baseURL = CONTEXT_PATH;
    }
    if (token && token.trim().length) {
        config.headers[TOKEN_NAME] = token;
    }
    if (TouristsToken && TouristsToken.trim().length) {
        // console.log("TouristsToken:",TouristsToken);
        config.headers[Tourists_TOKEN_NAME] = TouristsToken;
    }
    //只对登录/注册生效。这两个接口都是 postRequest 发出去的，
    //而 postRequest 内部做过 JSON.stringify，所以 config.data 必然是 JSON 字符串
    const needEncrypt = ENCRYPT_PATHS.some(p => config.url?.includes(p));

    if (needEncrypt) {
        let body = {};
        try {
            body = JSON.parse(config.data) || {};
        } catch (error) {
            console.warn('请求体不是合法 JSON，跳过加密：', config.url);
        }

        // ⚠️ 只能改 body（对象），不能改 config.data ——
        //    config.data 是字符串，给字符串设属性会直接抛 TypeError（ES Module 默认严格模式）
        if (typeof body.password === 'string') {
            body.password = sm2.doEncrypt(body.password, SM2_PUBLIC_KEY, SM2_CIPHER_MODE);
            body.timestamp = Date.now();                              // 时间戳
            body.nonce = Math.random().toString(36).slice(2);         // 一次性随机数
            config.data = JSON.stringify(body);                        // 改完再序列化写回
        }
    }

    return config;
}, error => {
    console.log(error);
});

// 响应拦截器
AXIOSAPI.interceptors.response.use(success => {
    const { setToken, setVale } = useAuthStore.getState();

    // console.log('响应结果：\n', success);
    // 确认成功调用到后台接口
    if (success.status && success.status === 200) {

        // success.headers是响应header
        if (success.headers[TOKEN_NAME.toLocaleLowerCase()] !== undefined) {
            setToken(success.headers[TOKEN_NAME.toLocaleLowerCase()]);
        }
        if (success.headers[Tourists_TOKEN_NAME.toLocaleLowerCase()] !== undefined) {
            setVale('TouristsToken', success.headers[Tourists_TOKEN_NAME.toLocaleLowerCase()]);
        }

        if (success.data.message) { }
    } 

    return success.data;

}, error => {

    const resp = error.response;
    if (resp) {
        let { status, statusText, config, data } = resp;
        console.log(status, statusText, data);
        if (resp.status && resp.status === 401) {
            //跳转登录
            useNav.getState().navigate('/Login', { replace: true });
        }
        if (data.code !== 0 || data.message) {
            message.error(status + ':' + statusText + '\n' + data.message);
        }
    }
    return Promise.reject(error)
});

// 传送json的put请求
export const putRequest = (url, params) => {
    return AXIOSAPI({
        url: url,
        method: 'put',
        data: params
    });
};

// 传送json的delete请求
export const deleteRequest = (url, params) => {
    return AXIOSAPI({
        url: url,
        method: 'delete',
        data: params
    });
};

// 传送json的get请求
export const getRequest = (url, params = {}) => {
    return AXIOSAPI({
        url: url,
        method: 'get',
        params: params
    });
};

// 传送json的post请求
export const postRequest = (url, params) => {

    params = params || {};
    const responseType = params['responseType'] || 'json'; // 默认值json，传blob可以下载文件
    delete params['responseType'];

    params = JSON.stringify(params);
    return AXIOSAPI({
        url: url,
        method: 'post',
        data: params,
        headers: { "Content-Type": "application/json" },
        responseType: responseType
    });
};

export const formRequest = (url, params) => {

    return AXIOSAPI({
        url: url,
        method: 'post',
        data: Qs.stringify(params), //设置QS序列化
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
}

export const fileRequest = (url, params) => {

    return AXIOSAPI({
        url: url,
        method: 'post',
        data: params,
        headers: { "Content-Type": "multipart/form-data" }
    });
}
