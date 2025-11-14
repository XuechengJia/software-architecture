const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');

// 所有接口均需要有权限控制（可选），这里暂不强制，前端路由守卫会校验
router.get('/tenants', controller.getTenants);
router.get('/active-users', controller.getActiveUsers);
router.get('/popular-routes', controller.getPopularRoutes);
router.get('/peak-hours', controller.getPeakHours);
router.get('/maintainers', controller.getMaintainers);

module.exports = router;