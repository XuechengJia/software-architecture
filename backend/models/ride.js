// backend/models/ride.js
const pool = require('../config/db');

const startRide = async (userId, vehicleId) => {
    const client = await pool.connect();
    // 检查用户是否已有进行中骑行
    const ongoing = await client.query(
        `SELECT id FROM rides WHERE user_id = $1 AND status = 'ONGOING'`,
        [userId]
    );
    if (ongoing.rows.length > 0) {
        throw new Error('您已有一辆车正在使用中');
    }
    try {
        await client.query('BEGIN');

        // 1. 检查车辆是否空闲
        const vehicleRes = await client.query(
            'SELECT status FROM vehicles WHERE id = $1 FOR UPDATE',
            [vehicleId]
        );
        if (!vehicleRes.rows[0] || vehicleRes.rows[0].status !== 'IDLE') {
            throw new Error('车辆不可用');
        }

        // 2. 更新车辆状态
        await client.query(
            'UPDATE vehicles SET status = $1 WHERE id = $2',
            ['IN_USE', vehicleId]
        );

        // 3. 创建骑行记录
        const rideRes = await client.query(
            `INSERT INTO rides (user_id, vehicle_id, park_id, start_time, status)
       VALUES ($1, $2, (SELECT park_id FROM vehicles WHERE id = $2), NOW(), 'ONGOING')
       RETURNING id, start_time`,
            [userId, vehicleId]
        );

        await client.query('COMMIT');
        return rideRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
const finishRide = async (userId, rideId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 获取骑行记录
        const rideRes = await client.query(
            `SELECT r.id, r.vehicle_id, r.start_time, r.status, v.park_id
       FROM rides r
       JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.id = $1 AND r.user_id = $2 FOR UPDATE`,
            [rideId, userId]
        );

        if (!rideRes.rows[0] || rideRes.rows[0].status !== 'ONGOING') {
            throw new Error('骑行记录无效或已结束');
        }

        const ride = rideRes.rows[0];
        const endTime = new Date();
        const minutes = Math.ceil((endTime - ride.start_time) / 60000); // 向上取整
        const fee = Math.max(minutes * 1.5, 1.5); // 最低1.5元

        // 2. 更新骑行记录
        await client.query(
            `UPDATE rides 
       SET end_time = $1, fee = $2, status = 'COMPLETED', updated_at = NOW()
       WHERE id = $3`,
            [endTime, fee, rideId]
        );

        // 3. 恢复车辆状态
        await client.query(
            `UPDATE vehicles SET status = 'IDLE' WHERE id = $1`,
            [ride.vehicle_id]
        );

        await client.query('COMMIT');
        return { fee, minutes, endTime };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { startRide, finishRide }; // 导出

