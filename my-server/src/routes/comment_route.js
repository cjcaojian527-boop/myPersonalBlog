const router = require('express').Router();
const multer = require('multer');
// const { requireAdmin } = require('../Uses');
const { getComment, addComment, updateComment, destroyComment } = require('../controllers/commentcontroller');





router.post('/getComment', getComment);

router.post('/addComment', addComment);

router.post('/updateComment', updateComment);

router.get('/destroyComment', destroyComment);


module.exports = router;
