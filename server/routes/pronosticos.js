const express = require('express')
const authMiddleware = require('../middleware/auth')
const validate = require('../middleware/validate')
const { pronosticoSchema } = require('../schemas/validation')
const ctrl = require('../controllers/pronosticos.controller')

const router = express.Router()

// Todo pronóstico requiere estar logueado.
router.use(authMiddleware)

router.post('/', validate(pronosticoSchema), ctrl.crearOActualizar)
router.get('/mios', ctrl.mios)

module.exports = router
