/**
 * sm-crypto 没有自带类型声明，这里只补用到的 SM4 部分。
 *
 * 注意：必须从 `sm-crypto/src/sm4` 导入，不要从总入口 `sm-crypto` 导入。
 * 总入口会连带 require SM2，而 SM2 在模块顶层就要调用 crypto.getRandomValues，
 * React Native / Hermes 没有这个 API，会在 App 启动时直接抛
 * 「当前环境不支持 crypto.getRandomValues！」。
 */
declare module 'sm-crypto/src/sm4' {
    interface Sm4Options {
        /** 填充方式，默认 pkcs#7 */
        padding?: 'pkcs#7' | 'none';
        /** 分组模式，默认 ecb */
        mode?: 'cbc' | 'ecb';
        /** CBC 模式的初始化向量（32 位十六进制） */
        iv?: string;
        /** 输出类型，默认 string（加密输出十六进制串，解密输出 utf8 串） */
        output?: 'string' | 'array';
    }

    const sm4: {
        encrypt(data: string, key: string, options?: Sm4Options): string;
        decrypt(data: string, key: string, options?: Sm4Options): string;
    };

    export default sm4;
}
