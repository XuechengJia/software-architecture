const pool = require('../config/db');

// 新增投诉
const createComplaint = async ({ reporterId, type, description, photoUrl, longitude, latitude }) => {
  const res = await pool.query(
      `INSERT INTO complaints (reporter_id, type, description, photo_url, location, status, created_at)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), '未处理', NOW())
     RETURNING *`,
      [reporterId, type, description, photoUrl, longitude, latitude] // 第一个参数为用户ID
  );
  return res.rows[0];
};

// 获取所有投诉
const getComplaints = async () => {
  const res = await pool.query(
      `SELECT id, type, description, photo_url, status, created_at, handled_at, handler,
              ST_X(location) AS longitude, ST_Y(location) AS latitude
       FROM complaints ORDER BY created_at DESC`
  );
  return res.rows;
};


// 获取某个用户自己的投诉 + 处理结果
const getComplaintsByReporter = async (reporterId) => {
  const res = await pool.query(
      `SELECT
        c.id,
        c.reporter_id,
        c.type,
        c.description,
        c.photo_url,
        c.status,
        c.created_at,
        c.handled_at,
        c.handler,
        c.reward_given,
        ST_X(c.location) AS longitude,
        ST_Y(c.location) AS latitude,
        -- 处理结果（来自 complaint_tasks）
        ct.result_text,
        ct.result_photo_url,
        ST_X(ct.result_location) AS result_lng,
        ST_Y(ct.result_location) AS result_lat
     FROM complaints c
     LEFT JOIN complaint_tasks ct
       ON ct.complaint_id = c.id
      AND ct.status = '已完成'  -- 只取已完成任务的结果
     WHERE c.reporter_id = $1
     ORDER BY c.created_at DESC`,
      [reporterId]
  );
  return res.rows;
};

// 处理投诉（更新投诉状态、处理人等）
const handleComplaint = async (id, handler) => {
  const res = await pool.query(
      `UPDATE complaints
        SET status='已处理',
            handled_at=NOW(),
            handler=$2
      WHERE id=$1
      RETURNING *`,
      [id, handler]
  );
  return res.rows[0];
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintsByReporter,
  handleComplaint
};
