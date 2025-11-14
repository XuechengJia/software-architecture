// backend/models/userPark.js
const pool = require('../config/db');

// 获取某个用户绑定的园区 ID 列表
const getUserParkIds = async (userId) => {
    const res = await pool.query(
        'SELECT park_id FROM user_parks WHERE user_id = $1 ORDER BY park_id',
        [userId]
    );
    return res.rows.map(row => row.park_id);
};

// 设置某个用户绑定的园区（先删后插）
const setUserParks = async (userId, parkIds) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM user_parks WHERE user_id = $1', [userId]);

        for (const parkId of parkIds) {
            await client.query(
                'INSERT INTO user_parks (user_id, park_id) VALUES ($1, $2)',
                [userId, parkId]
            );
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    getUserParkIds,
    setUserParks,
};
