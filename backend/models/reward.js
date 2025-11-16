// backend/models/reward.js
const pool = require('../config/db');

// 给投诉对应的用户发月卡
// 规则：
// 1. 每条投诉只送一次：complaints.reward_given = TRUE 之后，就不再重复送
// 2. 用户没有月卡或已过期 -> 从现在起加 30 天
//    用户月卡还没过期 -> 在原有效期基础上再加 30 天
const giveMonthlyCard = async (complaintId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 锁定这条投诉，防止并发重复赠送
        const { rows: complaintRows } = await client.query(
            `SELECT id, reporter_id, reward_given
       FROM complaints
       WHERE id = $1
       FOR UPDATE`,
            [complaintId]
        );

        if (complaintRows.length === 0) {
            throw new Error('投诉不存在');
        }

        const complaint = complaintRows[0];

        // 已经送过月卡，直接结束
        if (complaint.reward_given) {
            await client.query('COMMIT');
            return { alreadyGiven: true };
        }

        // 锁定用户
        const { rows: userRows } = await client.query(
            `SELECT id, monthly_card_expiry
       FROM users
       WHERE id = $1
       FOR UPDATE`,
            [complaint.reporter_id]
        );

        if (userRows.length === 0) {
            // 用户都不存在，就别送了，同时标记成已赠送，避免无限重试
            await client.query(
                'UPDATE complaints SET reward_given = TRUE WHERE id = $1',
                [complaint.id]
            );
            await client.query('COMMIT');
            return { alreadyGiven: false, userMissing: true };
        }

        // 更新用户的月卡有效期
        await client.query(
            `UPDATE users
         SET monthly_card_expiry = CASE
           WHEN monthly_card_expiry IS NULL OR monthly_card_expiry < NOW()
             THEN NOW() + INTERVAL '30 days'
           ELSE monthly_card_expiry + INTERVAL '30 days'
         END
       WHERE id = $1`,
            [complaint.reporter_id]
        );

        // 标记这条投诉已经送过奖励
        await client.query(
            'UPDATE complaints SET reward_given = TRUE WHERE id = $1',
            [complaint.id]
        );

        await client.query('COMMIT');
        return { alreadyGiven: false };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    giveMonthlyCard
};
