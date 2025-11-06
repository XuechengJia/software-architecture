const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

module.exports = app;
