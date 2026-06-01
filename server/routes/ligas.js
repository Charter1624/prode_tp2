const express = require('express')
const rateLimit = require('express-rate-limit')
const authMiddleware = require('../middleware/auth')
const validate = require('../middleware/validate')
const asyncHandler = require('../middleware/asyncHandler')
const { crearLigaSchema, unirseLigaSchema } = require('../schemas/validation')
const ctrl = require('../controllers/ligas.controller')

const router = express.Router()

// Todo lo de ligas requiere estar logueado.
router.use(authMiddleware)

// Límite al "unirse": defensa en profundidad contra adivinar códigos por fuerza bruta.
const unirseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Demasiados intentos, probá en un rato' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/', validate(crearLigaSchema), asyncHandler(ctrl.crear))
router.post('/unirse', unirseLimiter, validate(unirseLigaSchema), asyncHandler(ctrl.unirse))
router.get('/mias', asyncHandler(ctrl.mias))
router.get('/:id/ranking', asyncHandler(ctrl.ranking))

module.exports = router
