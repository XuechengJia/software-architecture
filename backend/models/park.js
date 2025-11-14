// backend/models/park.js
const pool = require('../config/db');

// 获取所有园区（包含边界信息）
const getAllParks = async () => {
    const res = await pool.query(`
    SELECT
      id,
      name,
      location,
      center_lng,
      center_lat,
      boundary_coordinates,
      created_at
    FROM parks
    ORDER BY id
  `);
    return res.rows;
};

// 通过 user_parks 关系表获取某个用户绑定的园区
const getParksByUserId = async (userId) => {
    const res = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.location,
      p.center_lng,
      p.center_lat,
      p.boundary_coordinates,
      p.created_at
    FROM parks p
    JOIN user_parks up ON up.park_id = p.id
    WHERE up.user_id = $1
    ORDER BY p.id
  `, [userId]);
    return res.rows;
};

/**
 * 根据当前登录用户的角色和 ID 获取可见的园区列表
 *
 * - TENANT（租客）：可以在同一运营方所有园区通用，这里直接返回全部园区
 * - PARK_ADMIN / OPERATOR / MAINTAINER：按 user_parks 绑定的园区过滤
 */
const getParksByUser = async (userId, userRole) => {
    if (!userId || !userRole) {
        return [];
    }

    if (userRole === 'TENANT') {
        // 租客可以在多个园区通用：这里返回全部园区
        return await getAllParks();
    }

    // 其他后台角色按绑定园区过滤
    const parks = await getParksByUserId(userId);
    return parks;
};

// 创建园区
const createPark = async ({ name, location, centerLng, centerLat, boundaryCoordinates }) => {
    const res = await pool.query(
        `INSERT INTO parks (name, location, center_lng, center_lat, boundary_coordinates, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
        [name, location, centerLng, centerLat, boundaryCoordinates]
    );
    return res.rows[0];
};

// 更新园区
const updatePark = async (id, { name, location, centerLng, centerLat, boundaryCoordinates }) => {
    const res = await pool.query(
        `UPDATE parks
     SET name = $2,
         location = $3,
         center_lng = $4,
         center_lat = $5,
         boundary_coordinates = $6
     WHERE id = $1
     RETURNING *`,
        [id, name, location, centerLng, centerLat, boundaryCoordinates]
    );
    return res.rows[0];
};

// 删除园区
const deletePark = async (id) => {
    const res = await pool.query(
        'DELETE FROM parks WHERE id = $1',
        [id]
    );
    return res.rowCount > 0;
};

module.exports = {
    getAllParks,
    getParksByUserId,
    getParksByUser,
    createPark,
    updatePark,
    deletePark,
};
