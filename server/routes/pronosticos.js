const express = require('express')
const authMiddleware = require('../middleware/auth')
const validate = require('../middleware/validate')
const asyncHandler = require('../middleware/asyncHandler')
const { pronosticoSchema } = require('../schemas/validation')
const ctrl = require('../controllers/pronosticos.controller')

const router = express.Router()

// Todo pronóstico requiere estar logueado.
router.use(authMiddleware)

router.post('/', validate(pronosticoSchema), asyncHandler(ctrl.crearOActualizar))
router.get('/mios', asyncHandler(ctrl.mios))
router.delete('/:id', asyncHandler(ctrl.borrar))

module.exports = router
