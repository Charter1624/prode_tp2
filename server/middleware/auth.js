const jwt = require('jsonwebtoken')
const User = require('../models/User')
const logger = require('../services/logger')

// Verifica el JWT del header Authorization: Bearer <token>.
// Si es válido, carga el usuario en req.user (sin la password, porque el
// modelo la tiene con select:false) y deja pasar. Si no, corta con 401.

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: 'Usuario inválido' })
    }
    req.user = user
    next()
  } catch (err) {
    logger.warn('Token inválido', { error: err.message })
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = authMiddleware
