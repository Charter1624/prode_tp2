require('dotenv').config()
const mongoose = require('mongoose')
const Equipo = require('../models/Equipo')
const Partido = require('../models/Partido')
const { resolverBracket } = require('../services/bracket')

// Prueba la resolución del cuadro: completa el Grupo A (resultados directos) y
// verifica que los slots "1A"/"2A" del cuadro se resuelvan a equipos reales.
// NO limpia (correr `npm run seed` después para resetear).

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  const eqA = await Equipo.find({ grupo: 'A' })
  const idsA = new Set(eqA.map((e) => String(e._id)))
  const grupos = await Partido.find({ fase: 'grupos' })
  const partA = grupos.filter(
    (p) => idsA.has(String(p.equipoLocal)) && idsA.has(String(p.equipoVisitante))
  )
  console.log('Grupo A:', eqA.map((e) => e.nombre).join(', '))
  console.log('Partidos del grupo A:', partA.length)

  // Cargar resultados (local gana 2-0 en todos) para tener posiciones definidas.
  for (const p of partA) {
    p.golesLocal = 2
    p.golesVisitante = 0
    p.estado = 'jugado'
    await p.save()
  }

  const cambios = await resolverBracket()
  console.log('Slots completados por resolverBracket():', cambios)

  const ko = await Partido.find({ fase: { $ne: 'grupos' } }).populate('equipoLocal equipoVisitante')
  const conA = ko.filter(
    (p) => ['1A', '2A'].includes(p.slotLocal) || ['1A', '2A'].includes(p.slotVisitante)
  )
  console.log('Partidos KO que dependían del grupo A:')
  for (const p of conA) {
    const l = p.equipoLocal ? `${p.equipoLocal.nombre} (G${p.equipoLocal.grupo})` : p.slotLocal
    const v = p.equipoVisitante ? `${p.equipoVisitante.nombre} (G${p.equipoVisitante.grupo})` : p.slotVisitante
    console.log(`  #${p.numero} ${p.fase}: ${l}  vs  ${v}`)
  }

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('Falló:', e.message)
  process.exit(1)
})
