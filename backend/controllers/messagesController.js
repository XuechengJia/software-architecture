// backend/controllers/messageController.js
const MessageModel = require('../models/messages');

const ADMIN_ROLES = ['OPERATOR', 'MAINTAINER', 'PARK_ADMIN'];

// GET /api/messages?chatGroup=xxx&limit=50
exports.listMessages = async (req, res) => {
    try {
        const chatGroup = req.query.chatGroup || 'GLOBAL'; // 默认一个全员群
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

        if (!chatGroup) {
            return res.status(400).json({ message: '缺少 chatGroup 参数' });
        }

        const rows = await MessageModel.getMessagesByGroup({ chatGroup, limit });

        const messages = rows.map(r => ({
            id: r.id,
            senderId: r.sender_id,
            senderName: r.sender_name,
            senderRole: r.sender_role,
            message: r.is_deleted ? null : r.message, // 删除后前端显示“已删除”
            timestamp: r.timestamp,
            chatGroup: r.chat_group,
            isDeleted: r.is_deleted
        }));

        res.json({ messages });
    } catch (err) {
        console.error('获取消息列表失败:', err);
        res.status(500).json({ message: '获取消息失败', error: err.message });
    }
};

// POST /api/messages
// body: { message, chatGroup }
exports.sendMessage = async (req, res) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return res.status(401).json({ message: '请先登录' });
        }

        const { message, chatGroup } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: '消息内容不能为空' });
        }

        const group = chatGroup || 'GLOBAL';

        const row = await MessageModel.createMessage({
            senderId: user.id,
            message: message.trim(),
            chatGroup: group
        });

        res.status(201).json({
            message: '发送成功',
            data: {
                id: row.id,
                senderId: row.sender_id,
                senderName: user.name || '',
                senderRole: user.role || '',
                message: row.message,
                timestamp: row.timestamp,
                chatGroup: row.chat_group,
                isDeleted: row.is_deleted
            }
        });
    } catch (err) {
        console.error('发送消息失败:', err);
        res.status(500).json({ message: '发送消息失败', error: err.message });
    }
};

// DELETE /api/messages/:id
exports.deleteMessage = async (req, res) => {
    try {
        const user = req.user;
        if (!user?.id) {
            return res.status(401).json({ message: '请先登录' });
        }

        if (!ADMIN_ROLES.includes(user.role)) {
            return res.status(403).json({ message: '无权限删除消息' });
        }

        const messageId = parseInt(req.params.id, 10);
        if (!messageId) {
            return res.status(400).json({ message: '缺少消息 ID' });
        }

        const updated = await MessageModel.softDeleteMessage({ messageId });

        if (!updated) {
            return res.status(404).json({ message: '消息不存在' });
        }

        res.json({
            message: '消息已删除',
            data: {
                id: updated.id,
                isDeleted: updated.is_deleted
            }
        });
    } catch (err) {
        console.error('删除消息失败:', err);
        res.status(500).json({ message: '删除消息失败', error: err.message });
    }
};
