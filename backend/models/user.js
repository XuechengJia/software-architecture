const pool = require('../config/db');
const bcrypt = require('bcrypt');

const createUser = async (phone, password, name, role) => {
    const password_hash = await bcrypt.hash(password, 10);  // 这里加密！
    const res = await pool.query(
        `INSERT INTO users (phone, password_hash, name, role)
         VALUES ($1, $2, $3, $4) RETURNING id, phone, name, role, created_at`,
        [phone, password_hash, name, role]
    );
    return res.rows[0];
};

const findUserByPhone = async (phone) => {
    const res = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return res.rows[0];
};

module.exports = { createUser, findUserByPhone };
