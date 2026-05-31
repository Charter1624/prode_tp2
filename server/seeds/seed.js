require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')
const { calcularPuntos } = require('../services/puntaje')
const logger = require('../services/logger')

// Seeder del prode (Unidad 5). Precarga datos para arrancar a jugar y, sobre
// todo, para PROBAR el cálculo de puntos y el ranking sin esperar al 11/06:
// siembra unos partidos ya "jugado" con resultado + pronósticos.
//
// Idempotente: limpia las colecciones antes de insertar.
// Correr con:  npm run seed   (desde server/)

const DEV_PASSWORD = 'prode1234'

// --- Datos a sembrar ------------------------------------------------------

const USUARIOS = [
  { key: 'admin', name: 'Lucho', email: 'admin@prode.com', admin: true },
  { key: 'tincho', name: 'Tincho', email: 'tincho@prode.com' },
  { key: 'naza', name: 'Naza', email: 'naza@prode.com' },
  { key: 'fede', name: 'Fede', email: 'fede@prode.com' },
]

// Partidos de prueba YA JUGADOS (fechas previas), para validar puntaje/ranking.
const JUGADOS = [
  { key: 'arg_pan', equipoLocal: 'Argentina', equipoVisitante: 'Panamá', golesLocal: 2, golesVisitante: 1, fecha: '2026-05-28T20:00:00' },
  { key: 'bra_bol', equipoLocal: 'Brasil', equipoVisitante: 'Bolivia', golesLocal: 3, golesVisitante: 0, fecha: '2026-05-29T20:00:00' },
  { key: 'fra_ale', equipoLocal: 'Francia', equipoVisitante: 'Alemania', golesLocal: 1, golesVisitante: 1, fecha: '2026-05-30T16:00:00' },
]

// Partidos PENDIENTES (apertura del Mundial). Reemplazar por el fixture oficial.
const PENDIENTES = [
  { equipoLocal: 'México', equipoVisitante: 'Canadá', fecha: '2026-06-11T20:00:00' },
  { equipoLocal: 'Argentina', equipoVisitante: 'Arabia Saudita', fecha: '2026-06-12T16:00:00' },
  { equipoLocal: 'Francia', equipoVisitante: 'Australia', fecha: '2026-06-13T19:00:00' },
  { equipoLocal: 'Brasil', equipoVisitante: 'Serbia', fecha: '2026-06-14T16:00:00' },
]

// Pronósticos sobre los partidos jugados (por key de usuario y de partido).
// Pensados para que den casos variados de puntaje (exacto / resultado / errado).
const PRONOSTICOS = [
  // Argentina 2-1 Panamá
  { user: 'admin', partido: 'arg_pan', golesLocal: 2, golesVisitante: 1 }, // exacto -> 3
  { user: 'tincho', partido: 'arg_pan', golesLocal: 1, golesVisitante: 0 }, // gana local -> 1
  { user: 'naza', partido: 'arg_pan', golesLocal: 0, golesVisitante: 2 }, // errado -> 0
  { user: 'fede', partido: 'arg_pan', golesLocal: 2, golesVisitante: 1 }, // exacto -> 3
  // Brasil 3-0 Bolivia
  { user: 'admin', partido: 'bra_bol', golesLocal: 2, golesVisitante: 0 }, // gana local -> 1
  { user: 'tincho', partido: 'bra_bol', golesLocal: 3, golesVisitante: 0 }, // exacto -> 3
  { user: 'naza', partido: 'bra_bol', golesLocal: 3, golesVisitante: 0 }, // exacto -> 3
  { user: 'fede', partido: 'bra_bol', golesLocal: 1, golesVisitante: 1 }, // errado -> 0
  // Francia 1-1 Alemania
  { user: 'admin', partido: 'fra_ale', golesLocal: 1, golesVisitante: 1 }, // exacto -> 3
  { user: 'tincho', partido: 'fra_ale', golesLocal: 2, golesVisitante: 2 }, // empate -> 1
  { user: 'naza', partido: 'fra_ale', golesLocal: 1, golesVisitante: 0 }, // errado -> 0
  { user: 'fede', partido: 'fra_ale', golesLocal: 0, golesVisitante: 0 }, // empate -> 1
]

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI no definido en server/.env')

  await mongoose.connect(uri)
  logger.info(`Conectado a Mongo: ${mongoose.connection.name} — limpiando colecciones`)

  await Promise.all([
    User.deleteMany({}),
    Partido.deleteMany({}),
    Pronostico.deleteMany({}),
  ])

  // 1. Usuarios (la password se hashea sola en el pre-save del modelo).
  const userPorKey = {}
  for (const u of USUARIOS) {
    const doc = await User.create({
      name: u.name,
      email: u.email,
      password: DEV_PASSWORD,
      admin: !!u.admin,
    })
    userPorKey[u.key] = doc
  }
  logger.info(`Creados ${USUARIOS.length} usuarios (password dev: ${DEV_PASSWORD})`)

  // 2. Partidos jugados (con resultado) + pendientes.
  const partidoPorKey = {}
  for (const p of JUGADOS) {
    const doc = await Partido.create({
      equipoLocal: p.equipoLocal,
      equipoVisitante: p.equipoVisitante,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      fecha: new Date(p.fecha),
      estado: 'jugado',
    })
    partidoPorKey[p.key] = doc
  }
  for (const p of PENDIENTES) {
    await Partido.create({
      equipoLocal: p.equipoLocal,
      equipoVisitante: p.equipoVisitante,
      fecha: new Date(p.fecha),
      estado: 'pendiente',
    })
  }
  logger.info(`Creados ${JUGADOS.length} partidos jugados y ${PENDIENTES.length} pendientes`)

  // 3. Pronósticos sobre los jugados, con los puntos ya calculados por la
  //    misma función pura que usa el backend (no se hardcodean).
  const docs = PRONOSTICOS.map((pr) => {
    const partido = partidoPorKey[pr.partido]
    const real = { golesLocal: partido.golesLocal, golesVisitante: partido.golesVisitante }
    const pron = { golesLocal: pr.golesLocal, golesVisitante: pr.golesVisitante }
    return {
      userId: userPorKey[pr.user]._id,
      partidoId: partido._id,
      golesLocal: pr.golesLocal,
      golesVisitante: pr.golesVisitante,
      puntos: calcularPuntos(real, pron),
    }
  })
  await Pronostico.create(docs)
  logger.info(`Creados ${docs.length} pronósticos`)

  // Resumen del ranking esperado (suma de puntos por usuario).
  const totales = {}
  for (const d of docs) {
    const u = USUARIOS.find((x) => userPorKey[x.key]._id.equals(d.userId))
    totales[u.name] = (totales[u.name] || 0) + d.puntos
  }
  logger.info('=== Seed completo ===')
  logger.info('Ranking esperado:')
  Object.entries(totales)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, pts], i) => logger.info(`  ${i + 1}. ${name.padEnd(8)} ${pts} pts`))

  await mongoose.disconnect()
}

seed().catch((err) => {
  logger.error('Seed falló', { error: err.message, stack: err.stack })
  process.exit(1)
})
