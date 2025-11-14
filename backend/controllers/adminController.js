const pool = require('../config/db');

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
// 获取维护员列表（供运营指派任务用）
const getMaintainers = async (req, res) => {
  try {
    const result = await pool.query(
        "SELECT id, name, phone FROM users WHERE role = 'MAINTAINER' AND status = 'ACTIVE' ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取维护员失败' });
  }
};


module.exports = { getTenants, getActiveUsers, getPopularRoutes, getPeakHours, getMaintainers };
