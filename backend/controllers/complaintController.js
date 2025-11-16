const ComplaintModel = require('../models/complaint');

// POST /api/complaints  提交投诉
exports.createComplaint = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '请先登录' });
    }

    const file = req.file;
    const photoUrl = file ? '/uploads/' + file.filename : null;

    const { type, description } = req.body;
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

    if (!type || !description || latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ message: '缺少必要字段：type/description/latitude/longitude' });
    }

    const row = await ComplaintModel.createComplaint({
      reporterId: userId,
      type,
      description,
      photoUrl,
      longitude,
      latitude
    });

    const complaint = {
      id: row.id,
      reporterId: row.reporter_id,
      type: row.type,
      description: row.description,
      photoUrl: row.photo_url,
      longitude,
      latitude,
      status: row.status,
      createdAt: row.created_at
    };

    res.status(201).json({ message: '投诉已提交', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '投诉提交失败', error: err.message });
  }
};

// GET /api/complaints
exports.getComplaints = async (req, res) => {
  try {
    const rows = await ComplaintModel.getComplaints();
    const complaints = rows.map(r => ({
      id: r.id,
      type: r.type,
      description: r.description,
      photoUrl: r.photo_url,
      longitude: r.longitude,
      latitude: r.latitude,
      status: r.status,
      createdAt: r.created_at,
      handledAt: r.handled_at,
      handler: r.handler
    }));
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: '获取投诉失败', error: err.message });
  }
};

// ⭐ GET /api/complaints/my  当前登录用户的“我的投诉”（带处理结果）
exports.getMyComplaints = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '请先登录' });
    }

    const rows = await ComplaintModel.getComplaintsByReporter(userId);

    const complaints = rows.map(r => {
      const hasResult = r.result_text || r.result_photo_url || (r.result_lng !== null && r.result_lat !== null);
      return {
        id: r.id,
        reporterId: r.reporter_id,
        type: r.type,
        description: r.description,
        photoUrl: r.photo_url,
        longitude: r.longitude,
        latitude: r.latitude,
        status: r.status,
        createdAt: r.created_at,
        handledAt: r.handled_at,
        handler: r.handler,
        reward: r.reward_given ? 'MONTH_CARD' : null,
        result: hasResult
            ? {
              text: r.result_text || '',
              photoUrl: r.result_photo_url || null,
              longitude: r.result_lng,
              latitude: r.result_lat
            }
            : null
      };
    });

    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '获取我的投诉失败', error: err.message });
  }
};

// POST /api/complaints/:id/handle  处理投诉（例如维护端调用）
exports.handleComplaint = async (req, res) => {
  try {
    const id = req.params.id;
    const handler = req.user?.name || '系统'; // 根据你的用户信息调整

    const updated = await ComplaintModel.handleComplaint(id, handler);
    if (!updated) {
      return res.status(404).json({ message: '投诉不存在' });
    }

    const complaint = {
      id: updated.id,
      reporterId: updated.reporter_id,
      type: updated.type,
      description: updated.description,
      photoUrl: updated.photo_url,
      status: updated.status,
      createdAt: updated.created_at,
      handledAt: updated.handled_at,
      handler: updated.handler
    };

    res.json({ message: '投诉已处理', complaint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '处理失败', error: err.message });
  }
};
