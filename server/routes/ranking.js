const express = require('express')
const asyncHandler = require('../middleware/asyncHandler')
const ctrl = require('../controllers/ranking.controller')

const router = express.Router()

// El ranking es público: cualquiera puede ver la tabla de posiciones.
router.get('/', asyncHandler(ctrl.listar))

module.exports = router
