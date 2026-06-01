const Equipo = require('../models/Equipo')

// Lógica de equipos (selecciones). Listar es público; crear es solo admin.

// GET /api/equipos — lista pública. Filtro opcional ?grupo=A.
async function listar(req, res) {
  const { grupo } = req.query
  const query = {}
  if (grupo) query.grupo = grupo.toUpperCase()

  const equipos = await Equipo.find(query).sort({ grupo: 1, nombre: 1 })
  res.json(equipos)
}

// POST /api/equipos — alta de un equipo (solo admin).
async function crear(req, res) {
  try {
    const equipo = await Equipo.create(req.body)
    res.status(201).json({ mensaje: 'Equipo creado', equipo })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya existe un equipo con ese nombre o código de país' })
    }
    throw err
  }
}

module.exports = { listar, crear }
