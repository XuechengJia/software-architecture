const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
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

// 提交投诉
router.post('/', authMiddleware,upload.single('photo'), complaintController.createComplaint);
// 获取投诉列表
router.get('/', complaintController.getComplaints);
// 处理投诉
router.post('/:id/handle', complaintController.handleComplaint);
// 当前登录用户的投诉列表（含处理结果）
router.get('/my', authMiddleware, complaintController.getMyComplaints);

module.exports = router;
