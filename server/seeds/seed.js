require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Equipo = require('../models/Equipo')
const Partido = require('../models/Partido')
const Pronostico = require('../models/Pronostico')
const Liga = require('../models/Liga')
const { calcularPuntos } = require('../services/puntaje')
const logger = require('../services/logger')

// Seeder del prode (Unidad 5). Precarga datos para arrancar a jugar y, sobre
// todo, para PROBAR el cálculo de puntos y el ranking sin esperar al 11/06:
// siembra unos partidos ya "jugado" con resultado + pronósticos.
//
// Orden: Equipos -> Usuarios -> Partidos (refs a Equipo) -> Pronósticos.
// Idempotente: limpia las colecciones antes de insertar.
// Correr con:  npm run seed   (desde server/)

const DEV_PASSWORD = 'prode1234'

const USUARIOS = [
  { key: 'admin', name: 'Lucho', email: 'admin@prode.com', admin: true },
  { key: 'tincho', name: 'Tincho', email: 'tincho@prode.com' },
  { key: 'naza', name: 'Naza', email: 'naza@prode.com' },
  { key: 'fede', name: 'Fede', email: 'fede@prode.com' },
]

// Selecciones con su código de país (bandera flagcdn) y grupo.
const EQUIPOS = [
  { nombre: 'Argentina', codigoPais: 'ar', grupo: 'A' },
  { nombre: 'México', codigoPais: 'mx', grupo: 'A' },
  { nombre: 'Canadá', codigoPais: 'ca', grupo: 'A' },
  { nombre: 'Panamá', codigoPais: 'pa', grupo: 'A' },
  { nombre: 'Brasil', codigoPais: 'br', grupo: 'B' },
  { nombre: 'Bolivia', codigoPais: 'bo', grupo: 'B' },
  { nombre: 'Serbia', codigoPais: 'rs', grupo: 'B' },
  { nombre: 'Francia', codigoPais: 'fr', grupo: 'C' },
  { nombre: 'Alemania', codigoPais: 'de', grupo: 'C' },
  { nombre: 'Australia', codigoPais: 'au', grupo: 'C' },
  { nombre: 'Arabia Saudita', codigoPais: 'sa', grupo: 'C' },
]

// Partidos YA JUGADOS (fechas previas) para validar puntaje/ranking.
const JUGADOS = [
  { key: 'arg_pan', local: 'Argentina', visitante: 'Panamá', golesLocal: 2, golesVisitante: 1, fecha: '2026-05-28T20:00:00' },
  { key: 'bra_bol', local: 'Brasil', visitante: 'Bolivia', golesLocal: 3, golesVisitante: 0, fecha: '2026-05-29T20:00:00' },
  { key: 'fra_ale', local: 'Francia', visitante: 'Alemania', golesLocal: 1, golesVisitante: 1, fecha: '2026-05-30T16:00:00' },
]

// Partidos PENDIENTES (apertura del Mundial). Reemplazar por el fixture oficial.
const PENDIENTES = [
  { local: 'México', visitante: 'Canadá', fecha: '2026-06-11T20:00:00' },
  { local: 'Argentina', visitante: 'Arabia Saudita', fecha: '2026-06-12T16:00:00' },
  { local: 'Francia', visitante: 'Australia', fecha: '2026-06-13T19:00:00' },
  { local: 'Brasil', visitante: 'Serbia', fecha: '2026-06-14T16:00:00' },
]

// Pronósticos sobre los jugados (por key de usuario y de partido), pensados
// para dar casos variados de puntaje (exacto / resultado / errado).
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
    Equipo.deleteMany({}),
    Partido.deleteMany({}),
    Pronostico.deleteMany({}),
    Liga.deleteMany({}),
  ])

  // 1. Equipos.
  const equipoPorNombre = {}
  for (const e of EQUIPOS) {
    equipoPorNombre[e.nombre] = await Equipo.create(e)
  }
  logger.info(`Creados ${EQUIPOS.length} equipos`)

  // 2. Usuarios (la password se hashea sola en el pre-save del modelo).
  const userPorKey = {}
  for (const u of USUARIOS) {
    userPorKey[u.key] = await User.create({
      name: u.name,
      email: u.email,
      password: DEV_PASSWORD,
      admin: !!u.admin,
    })
  }
  logger.info(`Creados ${USUARIOS.length} usuarios (password dev: ${DEV_PASSWORD})`)

  // 3. Partidos jugados (con resultado) + pendientes, referenciando equipos.
  const partidoPorKey = {}
  for (const p of JUGADOS) {
    partidoPorKey[p.key] = await Partido.create({
      equipoLocal: equipoPorNombre[p.local]._id,
      equipoVisitante: equipoPorNombre[p.visitante]._id,
      golesLocal: p.golesLocal,
      golesVisitante: p.golesVisitante,
      fecha: new Date(p.fecha),
      estado: 'jugado',
    })
  }
  for (const p of PENDIENTES) {
    await Partido.create({
      equipoLocal: equipoPorNombre[p.local]._id,
      equipoVisitante: equipoPorNombre[p.visitante]._id,
      fecha: new Date(p.fecha),
      estado: 'pendiente',
    })
  }
  logger.info(`Creados ${JUGADOS.length} partidos jugados y ${PENDIENTES.length} pendientes`)

  // 4. Pronósticos sobre los jugados, con los puntos ya calculados por la
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
