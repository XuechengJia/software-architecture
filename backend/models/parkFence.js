// backend/models/parkFence.js
const pool = require('../config/db');

// 按园区获取围栏列表
const getFencesByPark = async (parkId) => {
    const res = await pool.query(
        `SELECT id, park_id, fence_type, name, coordinates, created_at
     FROM park_fences
     WHERE park_id = $1
     ORDER BY id`,
        [parkId]
    );
    return res.rows;
};

// 创建围栏
const createFence = async ({ parkId, fenceType, name, coordinates }) => {
    const res = await pool.query(
        `INSERT INTO park_fences (park_id, fence_type, name, coordinates, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
        [parkId, fenceType, name, coordinates]
    );
    return res.rows[0];
};

// 更新围栏
const updateFence = async (id, { fenceType, name, coordinates }) => {
    const res = await pool.query(
        `UPDATE park_fences
     SET fence_type = $2,
         name = $3,
         coordinates = $4
     WHERE id = $1
     RETURNING *`,
        [id, fenceType, name, coordinates]
    );
    return res.rows[0];
};

// 删除围栏
const deleteFence = async (id) => {
    const res = await pool.query(
        'DELETE FROM park_fences WHERE id = $1',
        [id]
    );
    return res.rowCount > 0;
};

module.exports = {
    getFencesByPark,
    createFence,
    updateFence,
    deleteFence,
};
