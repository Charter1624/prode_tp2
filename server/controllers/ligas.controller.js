const crypto = require('crypto')
const mongoose = require('mongoose')
const Liga = require('../models/Liga')
const { obtenerRanking } = require('../services/ranking.service')

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I) para que el código sea legible.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Código de invitación cripto-aleatorio (no adivinable). 8 chars sobre 32 = ~10^12.
function generarCodigo(largo = 8) {
  const bytes = crypto.randomBytes(largo)
  let out = ''
  for (let i = 0; i < largo; i++) out += ALFABETO[bytes[i] % ALFABETO.length]
  return out
}

function esMiembro(liga, userId) {
  return liga.miembros.some((m) => m.equals(userId))
}

// POST /api/ligas — crea una liga; el creador queda como dueño y primer miembro.
async function crear(req, res) {
  const { nombre } = req.body

  let codigo
  for (let i = 0; i < 5; i++) {
    codigo = generarCodigo()
    if (!(await Liga.exists({ codigo }))) break
  }

  const liga = await Liga.create({
    nombre,
    codigo,
    creador: req.user._id,
    miembros: [req.user._id],
  })
  res.status(201).json({ mensaje: 'Liga creada', liga })
}

// POST /api/ligas/unirse — sumarse con un código de invitación.
async function unirse(req, res) {
  const codigo = req.body.codigo.toUpperCase().trim()
  const liga = await Liga.findOne({ codigo })
  if (!liga) return res.status(404).json({ error: 'No existe una liga con ese código' })

  if (esMiembro(liga, req.user._id)) {
    return res.json({ mensaje: 'Ya estás en esta liga', liga })
  }

  liga.miembros.push(req.user._id)
  await liga.save()
  res.json({ mensaje: 'Te uniste a la liga', liga })
}

// GET /api/ligas/mias — las ligas donde el usuario es miembro.
async function mias(req, res) {
  const ligas = await Liga.find({ miembros: req.user._id })
    .select('nombre codigo creador miembros')
    .sort({ createdAt: -1 })
  res.json(ligas)
}

// GET /api/ligas/:id/ranking — tabla de la liga. SOLO los miembros pueden verla.
async function ranking(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Liga no encontrada' })
  }

  const liga = await Liga.findById(id)
  if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })

  if (!esMiembro(liga, req.user._id)) {
    return res.status(403).json({ error: 'No sos miembro de esta liga' })
  }

  const tabla = await obtenerRanking(liga.miembros)
  res.json({
    // esCreador le dice a la app si mostrar el botón de eliminar (igual se valida en el server).
    liga: { _id: liga._id, nombre: liga.nombre, codigo: liga.codigo, esCreador: liga.creador.equals(req.user._id) },
    ranking: tabla,
  })
}

// DELETE /api/ligas/:id — eliminar la liga. SOLO el creador (o el admin global).
async function borrar(req, res) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: 'Liga no encontrada' })
  }

  const liga = await Liga.findById(id)
  if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })

  const esCreador = liga.creador.equals(req.user._id)
  if (!esCreador && !req.user.admin) {
    return res.status(403).json({ error: 'Solo el creador de la liga puede eliminarla' })
  }

  await liga.deleteOne()
  res.json({ mensaje: 'Liga eliminada' })
}

module.exports = { crear, unirse, mias, ranking, borrar }
