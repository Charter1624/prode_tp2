const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')

// Lógica de pronósticos. Todas las rutas van protegidas con authMiddleware,
// así que req.user siempre existe acá.

// POST /api/pronosticos — crea o actualiza el pronóstico del usuario logueado
// para un partido (upsert; el índice único userId+partidoId garantiza uno solo).
async function crearOActualizar(req, res) {
  const { partidoId, golesLocal, golesVisitante } = req.body

  const partido = await Partido.findById(partidoId)
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

  // Regla de negocio: solo se puede cargar/editar ANTES de que arranque el
  // partido. Se valida en el server, no se confía en el cliente.
  const yaEmpezo = partido.estado !== 'pendiente' || partido.fecha <= new Date()
  if (yaEmpezo) {
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

module.exports = { crearOActualizar, mios }
