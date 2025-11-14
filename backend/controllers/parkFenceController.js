// backend/controllers/parkFenceController.js
const parkFenceModel = require('../models/parkFence');

// GET /api/admin/park-fences?parkId=xxx
const listFencesByPark = async (req, res) => {
    try {
        const { parkId } = req.query;
        const pid = Number(parkId);
        if (!pid) {
            return res.status(400).json({ message: '缺少 parkId' });
        }
        const fences = await parkFenceModel.getFencesByPark(pid);
        res.json(fences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '获取围栏列表失败' });
    }
};

// POST /api/admin/park-fences
const createFence = async (req, res) => {
    try {
        const { parkId, fenceType, name, coordinates } = req.body;
        const pid = Number(parkId);
        if (!pid || !fenceType || !name) {
            return res.status(400).json({ message: 'parkId / fenceType / name 必填' });
        }
        const fence = await parkFenceModel.createFence({
            parkId: pid,
            fenceType,
            name,
            coordinates: coordinates || ''
        });
        res.status(201).json(fence);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '创建围栏失败' });
    }
};

// PUT /api/admin/park-fences/:id
const updateFence = async (req, res) => {
    try {
        const { id } = req.params;
        const { fenceType, name, coordinates } = req.body;
        const fid = Number(id);
        if (!fid || !fenceType || !name) {
            return res.status(400).json({ message: 'id / fenceType / name 必填' });
        }
        const fence = await parkFenceModel.updateFence(fid, {
            fenceType,
            name,
            coordinates: coordinates || ''
        });
        if (!fence) {
            return res.status(404).json({ message: '围栏不存在' });
        }
        res.json(fence);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '更新围栏失败' });
    }
};

// DELETE /api/admin/park-fences/:id
const deleteFence = async (req, res) => {
    try {
        const { id } = req.params;
        const fid = Number(id);
        const ok = await parkFenceModel.deleteFence(fid);
        if (!ok) {
            return res.status(404).json({ message: '围栏不存在' });
        }
        res.json({ message: '围栏已删除' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '删除围栏失败' });
    }
};

module.exports = {
    listFencesByPark,
    createFence,
    updateFence,
    deleteFence,
};
