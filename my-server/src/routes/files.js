const router = require('express').Router();
const multer = require('multer');
const { uploadFile, updateFile, destroyFile } = require('../controllers/filescontroller');
const { requireFile } = require('../Uses');

const upload = multer({
    storage: multer.memoryStorage(),  // ← 文件存内存，拿 req.file.buffer
    limits: { fileSize: 10 * 1024 * 1024 }  // 10MB 限制
});
// 文件大小超限时的友好报错（放在 upload.single 之后，controller 之前）
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.json({ code: -1, message: `文件太大，最大允许 10MB` });
    }
    next(err);
};



router.post('/upload', requireFile, upload.single('file'), handleMulterError, uploadFile);

router.post('/update', requireFile, upload.single('file'), handleMulterError, updateFile);

router.get('/destroy', requireFile, destroyFile);


module.exports = router;
