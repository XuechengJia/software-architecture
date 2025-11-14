const pool = require('../config/db');
const userParkModel = require('../models/userPark');
const parkModel = require('../models/park');

// 获取租客列表
const getTenants = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, phone, role, created_at FROM users WHERE role = 'TENANT' ORDER BY created_at DESC LIMIT 100");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取租客失败' });
  }
};

// 活跃用户统计（近 X 天）
const getActiveUsers = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.phone, COUNT(r.*) as rides
       FROM users u
       JOIN rides r ON u.id = r.user_id
       WHERE r.start_time >= NOW() - ($1::int || ' days')::interval
       GROUP BY u.id, u.name, u.phone
       ORDER BY rides DESC
       LIMIT 100`,
      [days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取活跃用户失败' });
  }
};

// 热门线路（按 start/end 网格聚合）
const getPopularRoutes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         round(ST_X(start_location)::numeric, 3) as start_lon,
         round(ST_Y(start_location)::numeric, 3) as start_lat,
         round(ST_X(end_location)::numeric, 3) as end_lon,
         round(ST_Y(end_location)::numeric, 3) as end_lat,
         COUNT(*) as cnt
       FROM rides
       WHERE start_location IS NOT NULL AND end_location IS NOT NULL
       GROUP BY 1,2,3,4
       ORDER BY cnt DESC
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取热门线路失败' });
  }
};

// 高峰时段统计（小时级别）
const getPeakHours = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const result = await pool.query(
      `SELECT EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as cnt
       FROM rides
       WHERE start_time >= NOW() - ($1::int || ' days')::interval
       GROUP BY hour
       ORDER BY cnt DESC
       LIMIT 24`,
      [days]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取高峰时段失败' });
  }
};

// 获取维护员列表
const getMaintainers = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, name, phone, status
      FROM users
      WHERE role = 'MAINTAINER'
      ORDER BY created_at DESC
      LIMIT 200
    `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取维护员失败' });
    }
};

// 更新维护员状态（ACTIVE / INACTIVE）
const updateMaintainerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: '非法状态值' });
    }

    try {
        const result = await pool.query(
            `UPDATE users
       SET status = $2, updated_at = NOW()
       WHERE id = $1 AND role = 'MAINTAINER'
       RETURNING id, name, phone, status`,
            [id, status]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '维护员不存在' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '更新维护员状态失败' });
    }
};

// 获取某个维护员当前绑定的园区 ID 列表
const getMaintainerParks = async (req, res) => {
    const { id } = req.params;
    try {
        const parkIds = await userParkModel.getUserParkIds(id);
        res.json({ userId: Number(id), parkIds });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取维护员园区绑定失败' });
    }
};

// 设置某个维护员绑定的园区（覆盖原有绑定）
const setMaintainerParks = async (req, res) => {
    const { id } = req.params;
    const { parkIds } = req.body;

    if (!Array.isArray(parkIds)) {
        return res.status(400).json({ message: 'parkIds 必须是数组' });
    }

    const parsedIds = parkIds.map(Number).filter(n => !Number.isNaN(n));

    try {
        await userParkModel.setUserParks(id, parsedIds);
        res.json({ userId: Number(id), parkIds: parsedIds });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '更新维护员园区绑定失败' });
    }
};
// （1）管理员获取全部园区列表（不按 user_parks 过滤）
const getAllParksForAdmin = async (req, res) => {
    try {
        const parks = await parkModel.getAllParks();
        res.json(parks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取园区列表失败' });
    }
};

// （2）运营账号管理
const getOperators = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, name, phone, status
      FROM users
      WHERE role = 'OPERATOR'
      ORDER BY created_at DESC
      LIMIT 200
    `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取运营账号失败' });
    }
};

const updateOperatorStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: '非法状态值' });
    }

    try {
        const result = await pool.query(
            `UPDATE users
       SET status = $2, updated_at = NOW()
       WHERE id = $1 AND role = 'OPERATOR'
       RETURNING id, name, phone, status`,
            [id, status]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '运营账号不存在' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '更新运营账号状态失败' });
    }
};

// （3）租客账号管理
const getTenantAccounts = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT id, name, phone, status
      FROM users
      WHERE role = 'TENANT'
      ORDER BY created_at DESC
      LIMIT 500
    `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取租客账号失败' });
    }
};

const updateTenantStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: '非法状态值' });
    }

    try {
        const result = await pool.query(
            `UPDATE users
       SET status = $2, updated_at = NOW()
       WHERE id = $1 AND role = 'TENANT'
       RETURNING id, name, phone, status`,
            [id, status]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '租客账号不存在' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '更新租客账号状态失败' });
    }
};


module.exports = {
    getTenants,
    getActiveUsers,
    getPopularRoutes,
    getPeakHours,
    getMaintainers,
    updateMaintainerStatus,
    getMaintainerParks,
    setMaintainerParks,
    getAllParksForAdmin,
    getOperators,
    updateOperatorStatus,
    getTenantAccounts,
    updateTenantStatus,
};

