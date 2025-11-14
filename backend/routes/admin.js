const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');

// 所有接口均需要有权限控制（可选），这里暂不强制，前端路由守卫会校验
router.get('/tenants', controller.getTenants);
router.get('/active-users', controller.getActiveUsers);
router.get('/popular-routes', controller.getPopularRoutes);
router.get('/peak-hours', controller.getPeakHours);
// 维护员管理
router.get('/maintainers', controller.getMaintainers);
router.patch('/maintainers/:id/status', controller.updateMaintainerStatus);
router.get('/maintainers/:id/parks', controller.getMaintainerParks);
router.put('/maintainers/:id/parks', controller.setMaintainerParks);
// 园区列表（管理员视角）
router.get('/parks', controller.getAllParksForAdmin);
router.post('/parks', controller.createPark);
router.put('/parks/:id', controller.updatePark);
router.delete('/parks/:id', controller.deletePark);
// 运营账号管理
router.get('/operators', controller.getOperators);
router.patch('/operators/:id/status', controller.updateOperatorStatus);

// 租客账号管理
router.get('/tenants-accounts', controller.getTenantAccounts);
router.patch('/tenants-accounts/:id/status', controller.updateTenantStatus);
module.exports = router;