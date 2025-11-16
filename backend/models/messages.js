// backend/models/messages.js
const pool = require('../config/db');

// 创建消息
const createMessage = async ({ senderId, message, chatGroup }) => {
    const res = await pool.query(
        `INSERT INTO messages (sender_id, message, chat_group)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, message, timestamp, chat_group, is_deleted`,
        [senderId, message, chatGroup]
    );
    return res.rows[0];
};

// 按群组获取消息列表（按时间倒序，limit 可配）
const getMessagesByGroup = async ({ chatGroup, limit = 50 }) => {
    const res = await pool.query(
        `SELECT
        m.id,
        m.sender_id,
        m.message,
        m.timestamp,
        m.chat_group,
        m.is_deleted,
        u.name   AS sender_name,
        u.role   AS sender_role
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.chat_group = $1
     ORDER BY m.timestamp DESC
     LIMIT $2`,
        [chatGroup, limit]
    );
    return res.rows;
};

// 软删除（标记 is_deleted = TRUE）
const softDeleteMessage = async ({ messageId }) => {
    const res = await pool.query(
        `UPDATE messages
        SET is_deleted = TRUE
      WHERE id = $1
      RETURNING id, sender_id, message, timestamp, chat_group, is_deleted`,
        [messageId]
    );
    return res.rows[0];
};

module.exports = {
    createMessage,
    getMessagesByGroup,
    softDeleteMessage
};
