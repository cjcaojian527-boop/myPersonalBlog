const express = require("express");
const cors = require('cors');
const cron = require('node-cron');
const { DB, ensureDatabase } = require('./config/database');
const initRoute = require('./routes');
const confData = require('./config');

// require('dotenv').config();  
const app = express();
// 启用 CORS，允许前端（不同域名/端口）访问后端接口
app.set('trust proxy', true);
// app.use(cors());
// 解析 JSON 格式的请求体，limit: '10mb' 限制请求体最大 10MB（防止大文件攻击）
app.use(express.json({ limit: '10mb' }));

try {
    initRoute(app);

} catch (err) {
    // 启动过程中任何一步失败，打印错误并退出进程
    console.error('注册路由报错:', err);
    process.exit(1);
}

//启动服务
async function runService() {

    try {
        await ensureDatabase();
        await DB.authenticate();//测试连接

        const { syncModel } = require('./models');
        await syncModel();
        console.log('模型全部同步成功···');



        app.listen(confData.port, () => {
            console.log(`Server  ✅ running on : http://localhost:${confData.port}`);
            const { testConnection, cleanOrphanFiles } = require('./services/minio');
            testConnection(() => {
                //// 模型同步完毕后，注册定时任务
                cron.schedule('0 5 * * *', async () => {
                    console.log('[定时任务] 开始清理 MinIO 孤儿文件...');
                    try {
                        await cleanOrphanFiles();
                    } catch (error) {
                        console.error('[定时任务] 清理失败:', error.message);
                    }
                });
                console.log('[定时任务] MinIO 孤儿文件清理已注册，每天 05:00 执行');
            });
        })
    } catch (err) {
        // 启动过程中任何一步失败，打印错误并退出进程
        console.error('服务启动报错:', err);
        process.exit(1);
    }

}

runService();//启动



