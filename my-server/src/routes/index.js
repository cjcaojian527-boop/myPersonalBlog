
const { routeInfo } = require('../config');
const { authMiddleware, ErrorFN, statsMiddleware } = require('../Uses');
const _path = require('path');



const routeList = [
    { path: '/auth', name: 'auth', fn: () => require('./auth') },
    { path: '/articleType', name: 'articleType_route' },
    { path: '/labels', name: 'labels_route' },
    { path: '/artcle', name: 'artcle_route' },
    { path: '/context', name: 'context_route' },
    { path: '/menu', name: 'menu_route' },
    { path: '/files', name: 'files' },
    { path: '/touristsAuth', name: 'touristsAuth' },
    { path: '/comment', name: 'comment_route' },
    { path: '/stats', name: 'stats_route' }
]



module.exports = function (app) {
    // 访问统计中间件（放在最前面，所有请求都计入）
    app.use(statsMiddleware);
    app.use(authMiddleware);
    //注册接口路由
    routeList.forEach(route => {
        const toPath = routeInfo.baseUri + route.path;//=> /api/auth
        try {
            const fn = route.fn ? route.fn() : require(_path.join(__dirname, route.name))
            app.use(toPath, fn)
        } catch (error) {

            throw new Error(`[路由注册] : ${toPath} 加载失败`, { cause: error });
        }
    })

    // 全局错误兜底，放在所有路由之后
    app.use(ErrorFN);

}