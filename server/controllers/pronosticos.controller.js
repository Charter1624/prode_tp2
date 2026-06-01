const mongoose = require('mongoose')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')

// Lógica de pronósticos. Todas las rutas van protegidas con authMiddleware,
// así que req.user siempre existe acá.

// Helper: ¿el partido ya empezó? (cerrado para pronosticar/editar/borrar)
function yaEmpezo(partido) {
  return !partido || partido.estado !== 'pendiente' || partido.fecha <= new Date()
}

// POST /api/pronosticos — crea o actualiza el pronóstico del usuario logueado
// para un partido (upsert; el índice único userId+partidoId garantiza uno solo).
async function crearOActualizar(req, res) {
  const { partidoId, golesLocal, golesVisitante } = req.body

  const partido = await Partido.findById(partidoId)
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

  // Regla de negocio: solo se puede cargar/editar ANTES de que arranque el
  // partido. Se valida en el server, no se confía en el cliente.
  if (yaEmpezo(partido)) {
    return res.status(400).json({ error: 'El partido ya empezó: el pronóstico está cerrado' })
  }

  const pronostico = await Pronostico.findOneAndUpdate(
    { userId: req.user._id, partidoId },
    { $set: { golesLocal, golesVisitante } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  res.json({ mensaje: 'Pronóstico guardado', pronostico })
}

// GET /api/pronosticos/mios — los pronósticos del usuario logueado, con los
// datos del partido y sus equipos (nombre + bandera) para mostrarlos en la app.
async function mios(req, res) {
  const pronosticos = await Pronostico.find({ userId: req.user._id })
    .populate({
      path: 'partidoId',
      select: 'equipoLocal equipoVisitante fecha fase estado golesLocal golesVisitante',
      populate: [
        { path: 'equipoLocal', select: 'nombre codigoPais' },
        { path: 'equipoVisitante', select: 'nombre codigoPais' },
      ],
    })
    .sort({ createdAt: -1 })

  res.json(pronosticos)
}

// DELETE /api/pronosticos/:id — borra el pronóstico propio, solo si el partido
// todavía no empezó (misma regla que para editar).
async function borrar(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Pronóstico no encontrado' })
  }

  const pronostico = await Pronostico.findOne({ _id: id, userId: req.user._id })
  if (!pronostico) return res.status(404).json({ error: 'Pronóstico no encontrado' })

  const partido = await Partido.findById(pronostico.partidoId)
  if (yaEmpezo(partido)) {
    return res.status(400).json({ error: 'El partido ya empezó: no se puede borrar el pronóstico' })
  }

  await pronostico.deleteOne()
  res.json({ mensaje: 'Pronóstico eliminado' })
}

module.exports = { crearOActualizar, mios, borrar }
