const mongoose = require('mongoose')
const Equipo = require('../models/Equipo')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')
const { calcularPuntos } = require('../services/puntaje')

// Lógica de partidos. Las rutas wirean estos handlers con su middleware
// (auth + soloAdmin + validación) según corresponda.

// Equipos a "poblar" en las respuestas (para que la app muestre nombre + bandera).
const POP_EQUIPOS = [
  { path: 'equipoLocal', select: 'nombre codigoPais grupo' },
  { path: 'equipoVisitante', select: 'nombre codigoPais grupo' },
]

// GET /api/partidos — lista pública. Filtro opcional ?estado=pendiente|jugado.
async function listar(req, res) {
  const { estado } = req.query
  const query = {}
  if (estado) query.estado = estado

  const partidos = await Partido.find(query).populate(POP_EQUIPOS).sort({ fecha: 1 })
  res.json(partidos)
}

// POST /api/partidos — alta de un partido (solo admin). Valida que ambos
// equipos existan; que no sean el mismo ya lo cubren el schema y el modelo.
async function crear(req, res) {
  const { equipoLocal, equipoVisitante } = req.body
  const [local, visitante] = await Promise.all([
    Equipo.findById(equipoLocal),
    Equipo.findById(equipoVisitante),
  ])
  if (!local || !visitante) {
    return res.status(404).json({ error: 'Equipo local o visitante no encontrado' })
  }

  const partido = await Partido.create(req.body)
  await partido.populate(POP_EQUIPOS)
  res.status(201).json({ mensaje: 'Partido creado', partido })
}

// PUT /api/partidos/:id/resultado — el admin carga el marcador real.
// Marca el partido como jugado y recalcula los puntos de TODOS sus
// pronósticos (idempotente: si corrige el resultado, se recalcula bien).
async function cargarResultado(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Partido no encontrado' })
  }

  const partido = await Partido.findById(id)
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

  // No tiene sentido cargar el resultado de un partido que todavía no se jugó.
  if (partido.fecha > new Date()) {
    return res.status(400).json({ error: 'El partido todavía no se jugó' })
  }

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

  await partido.populate(POP_EQUIPOS)
  res.json({
    mensaje: 'Resultado cargado',
    partido,
    pronosticosActualizados: pronosticos.length,
  })
}

module.exports = { listar, crear, cargarResultado }
