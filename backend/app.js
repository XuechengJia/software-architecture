const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const vehicleRouter = require('./routes/vehicles');
const rideRouter = require('./routes/ride');
const complaintRouter = require('./routes/complaint');
const parkRouter = require('./routes/parks');
const adminRouter = require('./routes/admin');
const complaintTaskRouter = require('./routes/complaintTasks');
const adminParkFenceRouter = require('./routes/adminParkFences');



dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/ride', rideRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/complaint-tasks', complaintTaskRouter);
app.use('/api/admin/park-fences', adminParkFenceRouter);

app.use('/api/parks', parkRouter);
app.use('/api/admin', adminRouter);
app.use('/uploads', express.static(require('path').join(__dirname, 'public/uploads')));

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

module.exports = app;
