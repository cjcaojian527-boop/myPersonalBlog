import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
// 只引 SM4 子模块：总入口 'sm-crypto' 会连带加载 SM2，
// 而 SM2 在模块顶层就调用 crypto.getRandomValues，RN / Hermes 没有这个 API
import sm4 from 'sm-crypto/src/sm4';
import type { StateStorage } from 'zustand/middleware';

// 密钥单独放 SecureStore，跟密文分两个地方：
// 就算 AsyncStorage 的文件被拷走，没有这把钥匙也解不开
const KEY_NAME = 'auth_sm4_key';
// 密文带算法和版本前缀，以后换算法 / 换格式时能认出来
const PREFIX = 'sm4:v1:';
const isWeb = Platform.OS === 'web';

/** 生成 byteCount 字节的随机数，转成十六进制串（SM4 的密钥 / IV 都是 128 位） */
const randomHex = (byteCount: number): string =>
    Array.from(Crypto.getRandomBytes(byteCount), b => b.toString(16).padStart(2, '0')).join('');

/** Web 没有 Keychain，只能退回 localStorage；仅够开发调试，安全等级低于真机 */
const readWebKey = (): string | null => {
    try {
        return globalThis.localStorage?.getItem(KEY_NAME) ?? null;
    } catch {
        return null;
    }
};

const writeWebKey = (key: string): void => {
    try {
        globalThis.localStorage?.setItem(KEY_NAME, key);
    } catch {
        // 隐私模式 / 配额满：写不进去就本次运行内用内存里的密钥
    }
};

const readKey = async (): Promise<string | null> => {
    if (isWeb) return readWebKey();
    try {
        return await SecureStore.getItemAsync(KEY_NAME);
    } catch (error) {
        console.warn('读取本地加密密钥失败：', error);
        return null;
    }
};

const writeKey = async (key: string): Promise<void> => {
    if (isWeb) {
        writeWebKey(key);
        return;
    }
    try {
        await SecureStore.setItemAsync(KEY_NAME, key);
    } catch (error) {
        console.warn('保存本地加密密钥失败：', error);
    }
};

// 多个写入可能同时发生，用同一个 Promise 保证只生成一把钥匙
let keyPromise: Promise<string> | null = null;

const getKey = (): Promise<string> => {
    if (!keyPromise) {
        keyPromise = (async () => {
            const existing = await readKey();
            if (existing && existing.length === 32) return existing;

            const key = randomHex(16);
            await writeKey(key);
            return key;
        })().catch(error => {
            // 失败别把 Promise 卡死，下次调用还能重试
            keyPromise = null;
            throw error;
        });
    }
    return keyPromise;
};

const encrypt = (plain: string, key: string): string => {
    const iv = randomHex(16);
    const cipher = sm4.encrypt(plain, key, { mode: 'cbc', iv });
    return `${PREFIX}${iv}:${cipher}`;
};

const decrypt = (payload: string, key: string): string | null => {
    // 兼容还没加密过的历史数据：没有前缀就当明文原样返回
    if (!payload.startsWith(PREFIX)) return payload;

    const body = payload.slice(PREFIX.length);
    const sep = body.indexOf(':');
    if (sep < 0) return null;

    const iv = body.slice(0, sep);
    const cipher = body.slice(sep + 1);
    try {
        return sm4.decrypt(cipher, key, { mode: 'cbc', iv });
    } catch (error) {
        // 换设备 / 卸载重装 / 密钥丢了都会走到这。
        // 解不开就当作未登录，绝不能让 App 卡死在启动页
        console.warn('本地登录态解密失败，按未登录处理：', error);
        return null;
    }
};

/**
 * zustand persist 的存储适配器。
 * 写：明文 JSON → SM4-CBC 加密 → AsyncStorage
 * 读：AsyncStorage → SM4-CBC 解密 → 明文 JSON
 */
export const encryptedStorage: StateStorage = {
    getItem: async (name) => {
        try {
            const raw = await AsyncStorage.getItem(name);
            if (!raw) return null;
            const key = await getKey();
            return decrypt(raw, key);
        } catch (error) {
            console.warn('读取本地登录态失败：', error);
            return null;
        }
    },

    setItem: async (name, value) => {
        try {
            const key = await getKey();
            await AsyncStorage.setItem(name, encrypt(value, key));
        } catch (error) {
            console.warn('写入本地登录态失败：', error);
        }
    },

    removeItem: async (name) => {
        try {
            // 只清数据，不删密钥：下次登录还要用它加密
            await AsyncStorage.removeItem(name);
        } catch (error) {
            console.warn('清除本地登录态失败：', error);
        }
    },
};
