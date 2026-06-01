const express = require('express')
const authMiddleware = require('../middleware/auth')
const { soloAdmin } = require('../middleware/roles')
const validate = require('../middleware/validate')
const asyncHandler = require('../middleware/asyncHandler')
const { crearEquipoSchema } = require('../schemas/validation')
const ctrl = require('../controllers/equipos.controller')

const router = express.Router()

// Listar es público (la app muestra los equipos y sus banderas).
// Crear es solo del admin.
router.get('/', asyncHandler(ctrl.listar))
router.post('/', authMiddleware, soloAdmin, validate(crearEquipoSchema), asyncHandler(ctrl.crear))

module.exports = router
