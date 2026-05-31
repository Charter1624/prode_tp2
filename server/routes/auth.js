const express = require('express')
const rateLimit = require('express-rate-limit')
const authMiddleware = require('../middleware/auth')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../schemas/validation')
const ctrl = require('../controllers/auth.controller')

const router = express.Router()

// Límite más estricto en login/register para frenar fuerza bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos, probá en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', authLimiter, validate(registerSchema), ctrl.register)
router.post('/login', authLimiter, validate(loginSchema), ctrl.login)
router.get('/me', authMiddleware, ctrl.me)

module.exports = router
