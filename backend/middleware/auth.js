const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: '未授权' })
    }

    const token = authHeader.split(' ')[1]
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload // { id, role }
        next()
    } catch (err) {
        return res.status(401).json({ message: '登录已过期' })
    }
}

module.exports = authMiddleware
