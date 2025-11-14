// backend/routes/adminParkFences.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/parkFenceController');

// 围栏管理（管理员）
router.get('/', controller.listFencesByPark);
router.post('/', controller.createFence);
router.put('/:id', controller.updateFence);
router.delete('/:id', controller.deleteFence);

module.exports = router;
