const { createUser, findUserByPhone } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const { phone, password, name, role = 'TENANT' } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ message: '手机号和密码必填' });
    }

    try {
        const existingUser = await findUserByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ message: '用户已存在' });
        }

        const user = await createUser(phone, password, name, role);
        res.status(201).json({ message: '注册成功', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '服务器错误' });
    }
};

const login = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await findUserByPhone(phone);
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ message: '用户不存在或未激活' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: '密码错误' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: '登录成功',
            token,
            user: { id: user.id, phone: user.phone, name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: '服务器错误' });
    }
};

module.exports = { register, login };
