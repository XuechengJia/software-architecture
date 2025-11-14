const pool = require('../config/db');

// 创建任务（运营指派给维护员）
const createTask = async ({ complaintId, maintainerId }) => {
    const res = await pool.query(
        `INSERT INTO complaint_tasks (complaint_id, maintainer_id, status, created_at)
     VALUES ($1, $2, '待处理', NOW())
     RETURNING *`,
        [complaintId, maintainerId]
    );

    // 顺便把投诉标记为“处理中”（只有原来是未处理才更新）
    await pool.query(
        `UPDATE complaints SET status = '处理中'
     WHERE id = $1 AND status = '未处理'`,
        [complaintId]
    );

    return res.rows[0];
};

// 按维护员查询任务列表
const getTasksByMaintainer = async (maintainerId) => {
    const res = await pool.query(
        `SELECT
       ct.id,
       ct.status,
       ct.created_at,
       ct.completed_at,
       ct.complaint_id,
       c.type,
       c.description,
       c.photo_url,
       ST_X(c.location) AS complaint_longitude,
       ST_Y(c.location) AS complaint_latitude
     FROM complaint_tasks ct
     JOIN complaints c ON c.id = ct.complaint_id
     WHERE ct.maintainer_id = $1
     ORDER BY ct.created_at DESC`,
        [maintainerId]
    );
    return res.rows;
};

// 完成任务（写入结果、坐标、照片）
const completeTask = async ({
                                taskId,
                                maintainerId,
                                resultText,
                                resultPhotoUrl,
                                longitude,
                                latitude
                            }) => {
    const res = await pool.query(
        `UPDATE complaint_tasks
     SET status = '已完成',
         result_text = $3,
         result_photo_url = $4,
         result_location = ST_SetSRID(ST_MakePoint($5, $6), 4326),
         completed_at = NOW()
     WHERE id = $1 AND maintainer_id = $2
     RETURNING *`,
        [taskId, maintainerId, resultText, resultPhotoUrl, longitude, latitude]
    );
    return res.rows[0];
};

// 根据 id 查任务（用于拿 complaint_id）
const getTaskById = async (taskId) => {
    const res = await pool.query(
        `SELECT * FROM complaint_tasks WHERE id = $1`,
        [taskId]
    );
    return res.rows[0];
};

module.exports = { createTask, getTasksByMaintainer, completeTask, getTaskById };
