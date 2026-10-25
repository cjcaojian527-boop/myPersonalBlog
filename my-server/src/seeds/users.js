module.exports = [
    //默认用户
    {
        id: 1,
        name: 'admin',
        name_display: 'Frank Gallagher',
        describe: '初始管理员...',
        password: '$2a$10$2CvAGzjJYDAGQFVNEHXkIONL30KYxF68kGQvab9jmVTWEUDtBw/ye',
        isSystem: true,
        role: 'super_admin'
    },
    {
        id: 2,
        name: 'CloseAccount',
        name_display: '账号已注销',
        describe: '这是已注销账户，专门用于存储接收那些被删除用户的文章以及评论。',
        password: '$2a$10$md7ao4iaVeycENrJ8N81ku1AWT9m3HPa4qfahY/fgTyUbUjJ/I9f.',
        isSystem: true,
        role: 'admin'
    },
    {
        id: 3,
        name: 'tempUser',
        name_display: '临时管理员',
        describe: '临时用户...',
        password: '$2a$10$zwA..IEhovFcPY0diCIKjulI1IKR81HIHhD1jr7ZxsTJIaPXXQ6y2',
        isSystem: false,
        role: 'temp_admin'
    }
]