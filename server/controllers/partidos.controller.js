const mongoose = require('mongoose')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')
const { calcularPuntos } = require('../services/puntaje')

// Lógica de partidos. Las rutas (routes/partidos.js) wirean estos handlers
// con su middleware (auth + soloAdmin + validación) según corresponda.

// GET /api/partidos — lista pública. Filtro opcional ?estado=pendiente|jugado.
async function listar(req, res) {
  const { estado } = req.query
  const query = {}
  if (estado) query.estado = estado

  const partidos = await Partido.find(query).sort({ fecha: 1 })
  res.json(partidos)
}

// POST /api/partidos — alta de un partido (solo admin). El grueso del fixture
// conviene cargarlo con el seeder; este endpoint es para altas sueltas.
async function crear(req, res) {
  const partido = await Partido.create(req.body)
  res.status(201).json({ mensaje: 'Partido creado', partido })
}

// PUT /api/partidos/:id/resultado — el admin carga el marcador real.
// Marca el partido como jugado y recalcula los puntos de TODOS los
// pronósticos de ese partido (idempotente: si corrige el resultado, se
// vuelven a calcular bien).
async function cargarResultado(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Partido no encontrado' })
  }

  const partido = await Partido.findById(id)
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

  const { golesLocal, golesVisitante } = req.body
  partido.golesLocal = golesLocal
  partido.golesVisitante = golesVisitante
  partido.estado = 'jugado'
  await partido.save()

  const real = { golesLocal, golesVisitante }
  const pronosticos = await Pronostico.find({ partidoId: partido._id })
  for (const p of pronosticos) {
    p.puntos = calcularPuntos(real, p)
    await p.save()
  }

  res.json({
    mensaje: 'Resultado cargado',
    partido,
    pronosticosActualizados: pronosticos.length,
  })
}

module.exports = { listar, crear, cargarResultado }
