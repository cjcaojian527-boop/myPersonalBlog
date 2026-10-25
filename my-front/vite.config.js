import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel';
import path from 'path';

// 生产构建时删除所有 console.xxx(...) 调用（零新依赖，走项目已有的 babel 插件链）。
// 只在 `vite build` 时生效，开发环境保留 console 方便调试。
const removeConsolePlugin = () => ({
  name: 'remove-console',
  visitor: {
    CallExpression(path) {
      const { callee } = path.node;
      if (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier'
      ) {
        // 把整条表达式语句一起删掉，避免留下空语句
        const parent = path.parentPath;
        if (parent.isExpressionStatement()) parent.remove();
        else path.remove();
      }
    },
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = command === 'build';   // 只有构建产物才移除 console



  return {

    base: mode === 'production' ? '/blog/' : '/',
    // publicDir: "public",
    server: {
      port: 9318,                 // 端口号
      open: false,                 // 自动打开浏览器
      host: "localhost",          // 主机名
      https: false,               // 是否用HTTPS
      proxy: {                    // 代理配置
        "/ServiceRequest": {
          // target: "https://dalanben.live",
          target: "http://127.0.0.1:3002",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ServiceRequest/, '')  // 加这行
        },
        "/Preview": {
          // target: "https://dalanben.live/Preview",
          target: "http://127.0.0.1:9000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/Preview/, '')  // 加这行
        }
      },
      cors: true,                 // 跨域配置
      hmr: {                      // 热更新配置
        overlay: true
      }
    },
    plugins: [
      react(),
      babel({
        presets: [reactCompilerPreset()],
        plugins: isProd ? [removeConsolePlugin] : [],
      })
    ],
    // 配置路径别名
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),  // @ 指向 src 目录
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss', '.css'],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              // 顺序有讲究：先匹配先生效，所以大库排前面
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)/ },
              { name: 'antd', test: /node_modules[\\/](antd|@ant-design)/ },
              { name: 'echarts', test: /node_modules[\\/](echarts|echarts-for-react)/ },
              { name: 'vendor', test: /node_modules/ }
            ],
          },
        },
      },
    }

  }
})
