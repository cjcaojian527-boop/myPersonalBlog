import AXIOSAPI from 'axios';
// import { sm2 } from 'sm-crypto';   // SM2 登录加密前端待做，先留着
import { CONTEXT_PATH, TOKEN_NAME, Tourists_TOKEN_NAME, SM2_PUBLIC_KEY, SM2_CIPHER_MODE, ENCRYPT_PATHS } from './const';
import { useAuthStore } from '@/store';

interface RequestOptions {
    responseType?: 'json' | 'blob';
    [key: string]: any,
}

// 请求拦截器
AXIOSAPI.interceptors.request.use(config => {
    const { TouristsToken } = useAuthStore.getState();

    config.baseURL = CONTEXT_PATH;
    if (TouristsToken && TouristsToken.trim().length) {
        config.headers[Tourists_TOKEN_NAME] = TouristsToken;
    }

    //只对登录/注册生效。这两个接口都是 postRequest 发出去的，
    //而 postRequest 内部做过 JSON.stringify，所以 config.data 必然是 JSON 字符串
    const needEncrypt = ENCRYPT_PATHS.some(p => config.url?.includes(p));

    // 等前端 SM2 接上后启用：
    // if (needEncrypt) {
    //     let body = {};
    //     try {
    //         body = JSON.parse(config.data) || {};
    //     } catch (error) {
    //         console.warn('请求体不是合法 JSON，跳过加密：', config.url);
    //     }
    //
    //     // ⚠️ 只能改 body（对象），不能改 config.data ——
    //     //    config.data 是字符串，给字符串设属性会直接抛 TypeError（ES Module 默认严格模式）
    //     if (typeof body.password === 'string') {
    //         body.password = sm2.doEncrypt(body.password, SM2_PUBLIC_KEY, SM2_CIPHER_MODE);
    //         body.timestamp = Date.now();                              // 时间戳
    //         body.nonce = Math.random().toString(36).slice(2);         // 一次性随机数
    //         config.data = JSON.stringify(body);                        // 改完再序列化写回
    //     }
    // }

    return config;
}, error => {
    console.error(error);
});

// 响应拦截器
AXIOSAPI.interceptors.response.use(success => {
    // 确认成功调用到后台接口
    if (success.status && success.status === 200) {
        if (success.headers[Tourists_TOKEN_NAME.toLocaleLowerCase()] !== undefined) {
            useAuthStore.setState({ "TouristsToken": success.headers[Tourists_TOKEN_NAME.toLocaleLowerCase()] })
        }
    }

    return success.data;

}, error => {
    console.error('网络错误：', JSON.stringify(error));
    return Promise.reject(error)
});

// 传送json的put请求
export const putRequest = <T = unknown>(url: string, params: T) => {
    return AXIOSAPI({
        url: url,
        method: 'put',
        data: params
    });
};

// 传送json的delete请求
export const deleteRequest = <T = unknown>(url: string, params: T) => {
    return AXIOSAPI({
        url: url,
        method: 'delete',
        data: params
    });
};

// 传送json的get请求
export const getRequest = <T = unknown>(url: string, params?: T): Promise<any> => {
    return AXIOSAPI({
        url: url,
        method: 'get',
        params: params
    });
};

// 传送json的post请求
export const postRequest = <T extends object>(url: string, params: T, opt: RequestOptions = {}): Promise<any> => {
    const { responseType = 'json' } = opt;// params['responseType'] || 'json'; // 默认值json，传blob可以下载文件

    return AXIOSAPI({
        url: url,
        method: 'post',
        data: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
        responseType
    });
};

export const fileRequest = (url: string, params: Blob) => {

    return AXIOSAPI({
        url: url,
        method: 'post',
        data: params,
        headers: { "Content-Type": "multipart/form-data" }
    });
}
