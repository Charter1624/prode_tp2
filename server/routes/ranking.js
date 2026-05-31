const express = require('express')
const ctrl = require('../controllers/ranking.controller')

const router = express.Router()

// El ranking es público: cualquiera puede ver la tabla de posiciones.
router.get('/', ctrl.listar)

module.exports = router
