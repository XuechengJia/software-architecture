const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintTaskController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// 运营指派任务
router.post('/', controller.assignTask);

// 维护员查看自己的任务列表
router.get('/', controller.listTasksForMaintainer);

// 维护员提交处理结果（带图片）
router.post('/:id/complete', upload.single('photo'), controller.completeTask);

module.exports = router;
