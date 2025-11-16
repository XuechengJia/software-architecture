// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/auth');

// 获取群聊消息列表
router.get('/', authMiddleware, messageController.listMessages);

// 发送消息
router.post('/', authMiddleware, messageController.sendMessage);

// 删除消息（仅管理员角色）
router.delete('/:id', authMiddleware, messageController.deleteMessage);

module.exports = router;
