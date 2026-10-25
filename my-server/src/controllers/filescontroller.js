const { minioClient } = require('../services/minio');
const { minioCofig: { bucketName, ...MINIO_OBJ } } = require('../config');

const path = require('path');



exports.uploadFile = async (req, res) => {
    let { body, file } = req;

    try {

        // console.log(body);
        if (file) {
            // 生成唯一文件名
            const ext = path.extname(file.originalname);
            const objectName = `images/${file.fieldname}/${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;

            // 从 Buffer 上传
            const etag = await minioClient.putObject(
                bucketName,                    // 存储桶
                objectName,                // 对象名
                file.buffer,               // Buffer 数据
                file.buffer.length,
                {
                    'Content-Type': file.mimetype,
                    'Content-Disposition': 'inline',
                }
            );
            file = null;
            //http://${MINIO_OBJ.endPoint}:${MINIO_OBJ.port}
            const fileUrl = `/${bucketName}/${objectName}`;
            return res.json({ code: 0, message: "文件上传成功！", data: fileUrl });

        } else {
            return res.json({ code: -1, message: "文件上传失败~" });
        }


    } catch (error) {
        console.error('文件上传失败:', error.errors);
        res.status(500).json({ code: -1, message: '文件上传失败: ' + error.message });
    }
}

exports.updateFile = async (req, res) => {
    const params = req.body;

    try {

        if (req.file) {
            if (params.objectName !== undefined && params.objectName.length > 0) {
                params.objectName = params.objectName.split(`/${bucketName}/`)[1];
                try {

                    await minioClient.removeObject(bucketName, params.objectName);
                    console.log('文件删除成功：' + params.objectName);
                    delete params.objectName;

                } catch (error) {
                    console.log('文件删除失败：' + params.objectName);
                }
            }
            // 生成唯一文件名
            const ext = path.extname(req.file.originalname);
            const objectName = `images/${req.file.fieldname}/${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;

            // 从 Buffer 上传
            const etag = await minioClient.putObject(
                bucketName,                    // 存储桶
                objectName,                // 对象名
                req.file.buffer,               // Buffer 数据
                req.file.buffer.length,
                {
                    'Content-Type': req.file.mimetype,
                    'Content-Disposition': 'inline',
                }
            );
            req.file = null;

            const fileUrl = `/${bucketName}/${objectName}`;
            return res.json({ code: 0, message: "文件更新成功！", data: fileUrl });
        } else {
            return res.json({ code: -1, message: "文件更新失败~" });
        }


    } catch (error) {
        console.error('文件更新失败:', error.message);
        res.status(500).json({ code: -1, message: '文件更新失败: ' + error.message });
    }
}

exports.destroyFile = async (req, res) => {
    let { objectName } = req.query;
    if (objectName == undefined) {
        return res.json({ code: -1, message: "删除失败，缺少参数：objectName ." })
    }
    try {
        objectName = objectName.split(`/${bucketName}/`)[1];

        await minioClient.removeObject(bucketName, objectName);
        console.log('文件删除成功：' + objectName);
        return res.json({ code: 0, message: '文件删除成功：' + objectName });

    } catch (error) {
        console.error('文件删除失败:', error.message);
        res.status(500).json({ code: -1, message: '文件删除失败: ' + error.message });
    }
}