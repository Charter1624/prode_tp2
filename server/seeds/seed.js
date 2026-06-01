require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Equipo = require('../models/Equipo')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')
const Liga = require('../models/Liga')
const logger = require('../services/logger')
const fixture = require('./fixture2026.json')

// Seeder del prode (Unidad 5). Carga el FIXTURE REAL del Mundial 2026
// (48 equipos + 72 partidos de fase de grupos, generado desde OpenFootball por
// scripts/generarFixture.js) + usuarios de prueba + pronósticos de muestra.
//
// Los partidos arrancan como "pendiente" (el torneo todavía no empezó), así que
// el ranking arranca en 0; el admin carga los resultados a medida que se juegan.
//
// Idempotente: limpia las colecciones antes de insertar.
// Correr con:  npm run seed   (desde server/)

const DEV_PASSWORD = 'prode1234'

const USUARIOS = [
  { key: 'admin', name: 'Lucho', email: 'admin@prode.com', admin: true },
  { key: 'tincho', name: 'Tincho', email: 'tincho@prode.com' },
  { key: 'naza', name: 'Naza', email: 'naza@prode.com' },
  { key: 'fede', name: 'Fede', email: 'fede@prode.com' },
]

// Marcadores de muestra (rotan) para que "Mis pronósticos" no arranque vacío.
const MUESTRA = [
  [2, 1], [1, 1], [0, 2], [3, 0], [1, 0], [2, 2],
]

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI no definido en server/.env')

  await mongoose.connect(uri)
  logger.info(`Conectado a Mongo: ${mongoose.connection.name} — limpiando colecciones`)

  await Promise.all([
    User.deleteMany({}),
    Equipo.deleteMany({}),
    Partido.deleteMany({}),
    Pronostico.deleteMany({}),
    Liga.deleteMany({}),
  ])

  // 1. Equipos (del fixture real).
  const equipoPorNombre = {}
  for (const e of fixture.equipos) {
    equipoPorNombre[e.nombre] = await Equipo.create(e)
  }
  logger.info(`Creados ${fixture.equipos.length} equipos`)

  // 2. Partidos de fase de grupos (refs a los equipos).
  const partidosDocs = []
  for (const p of fixture.partidos) {
    partidosDocs.push({
      equipoLocal: equipoPorNombre[p.local]._id,
      equipoVisitante: equipoPorNombre[p.visitante]._id,
      fecha: new Date(p.fecha),
      fase: 'grupos',
      estado: 'pendiente',
    })
  }
  const partidos = await Partido.create(partidosDocs)
  logger.info(`Creados ${partidos.length} partidos (fase de grupos)`)

  // 2b. Eliminatorias (con slots; los equipos quedan TBD hasta resolverse).
  const koDocs = fixture.eliminatorias.map((k) => ({
    numero: k.numero,
    fase: k.fase,
    fecha: new Date(k.fecha),
    slotLocal: k.slotLocal,
    slotVisitante: k.slotVisitante,
    estado: 'pendiente',
  }))
  await Partido.create(koDocs)
  logger.info(`Creados ${koDocs.length} partidos de eliminatorias (cuadro)`)

  // 3. Usuarios (la password se hashea sola en el pre-save del modelo).
  const usuarios = []
  for (const u of USUARIOS) {
    usuarios.push(
      await User.create({ name: u.name, email: u.email, password: DEV_PASSWORD, admin: !!u.admin })
    )
  }
  logger.info(`Creados ${USUARIOS.length} usuarios (password dev: ${DEV_PASSWORD})`)

  // 4. Pronósticos de muestra: cada usuario pronostica los primeros 6 partidos.
  const primeros = [...partidos].sort((a, b) => a.fecha - b.fecha).slice(0, 6)
  const pronos = []
  usuarios.forEach((user, ui) => {
    primeros.forEach((partido, pi) => {
      const [gl, gv] = MUESTRA[(ui + pi) % MUESTRA.length]
      pronos.push({ userId: user._id, partidoId: partido._id, golesLocal: gl, golesVisitante: gv })
    })
  })
  await Pronostico.create(pronos)
  logger.info(`Creados ${pronos.length} pronósticos de muestra (partidos aún pendientes → 0 puntos hasta que se jueguen)`)

  logger.info('=== Seed completo (fixture real del Mundial 2026) ===')
  logger.info(`Usuarios (password ${DEV_PASSWORD}): ${USUARIOS.map((u) => u.email).join(', ')}`)

  await mongoose.disconnect()
}

seed().catch((err) => {
  logger.error('Seed falló', { error: err.message, stack: err.stack })
  process.exit(1)
})
