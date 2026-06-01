const express = require('express')
const authMiddleware = require('../middleware/auth')
const { soloAdmin } = require('../middleware/roles')
const validate = require('../middleware/validate')
const asyncHandler = require('../middleware/asyncHandler')
const { crearPartidoSchema, resultadoSchema } = require('../schemas/validation')
const ctrl = require('../controllers/partidos.controller')

const router = express.Router()

// Listar es público (cualquiera ve el fixture). Crear y cargar resultado
// son solo del admin.
router.get('/', asyncHandler(ctrl.listar))
router.post('/', authMiddleware, soloAdmin, validate(crearPartidoSchema), asyncHandler(ctrl.crear))
router.put(
  '/:id/resultado',
  authMiddleware,
  soloAdmin,
  validate(resultadoSchema),
  asyncHandler(ctrl.cargarResultado)
)

module.exports = router
