const ComplaintTaskModel = require('../models/complaintTask');
const ComplaintModel = require('../models/complaint');

// 运营指派任务给维护员
exports.assignTask = async (req, res) => {
    try {
        const { complaintId, maintainerId } = req.body;
        const cid = parseInt(complaintId, 10);
        const mid = parseInt(maintainerId, 10);

        if (!cid || !mid) {
            return res.status(400).json({ message: '缺少 complaintId 或 maintainerId' });
        }

        const task = await ComplaintTaskModel.createTask({ complaintId: cid, maintainerId: mid });

        res.status(201).json({ message: '任务已创建', task });
    } catch (err) {
        res.status(500).json({ message: '创建任务失败', error: err.message });
    }
};

// 维护员查看自己的任务列表
exports.listTasksForMaintainer = async (req, res) => {
    try {
        const { maintainerId } = req.query;
        const mid = parseInt(maintainerId, 10);
        if (!mid) {
            return res.status(400).json({ message: '缺少 maintainerId' });
        }
        const rows = await ComplaintTaskModel.getTasksByMaintainer(mid);
        const tasks = rows.map(r => ({
            id: r.id,
            status: r.status,
            createdAt: r.created_at,
            completedAt: r.completed_at,
            complaintId: r.complaint_id,
            type: r.type,
            description: r.description,
            photoUrl: r.photo_url,
            complaintLongitude: r.complaint_longitude,
            complaintLatitude: r.complaint_latitude
        }));
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: '获取任务失败', error: err.message });
    }
};

// 维护员提交处理结果（坐标 + 照片 + 说明）
exports.completeTask = async (req, res) => {
    try {
        const { id } = req.params;
        const taskId = parseInt(id, 10);
        const { maintainerId, maintainerName, resultText, latitude, longitude } = req.body;
        const mid = parseInt(maintainerId, 10);
        const lat = latitude ? parseFloat(latitude) : null;
        const lng = longitude ? parseFloat(longitude) : null;

        if (!taskId || !mid || !resultText || lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
            return res.status(400).json({ message: '缺少必要字段：maintainerId/resultText/latitude/longitude' });
        }

        const file = req.file;
        const resultPhotoUrl = file ? '/uploads/' + file.filename : null;

        const updated = await ComplaintTaskModel.completeTask({
            taskId,
            maintainerId: mid,
            resultText,
            resultPhotoUrl,
            longitude: lng,
            latitude: lat
        });

        if (!updated) {
            return res.status(404).json({ message: '任务不存在或无权限' });
        }

        // 将投诉标记为已处理，并记录处理人
        const taskRow = await ComplaintTaskModel.getTaskById(taskId);
        if (taskRow) {
            const handler = maintainerName || '维护员';
            await ComplaintModel.handleComplaint(taskRow.complaint_id, handler);
        }

        res.json({ message: '任务已完成', taskId: updated.id });
    } catch (err) {
        res.status(500).json({ message: '提交处理结果失败', error: err.message });
    }
};

