const Equipo = require('../models/Equipo')
const Partido = require('../models/Partido')

// Resolución del cuadro de eliminatorias siguiendo el fixture oficial.
// Cada partido KO arranca con slots ("2A", "1E", "3A/B/C/D/F", "W73", "L101")
// y acá los resolvemos a equipos reales a medida que se cargan resultados:
//   - 1X / 2X : 1° y 2° del grupo X (cuando el grupo está completo).
//   - 3...    : uno de los 8 mejores terceros (asignación PROVISIONAL, ver nota).
//   - W## / L##: ganador / perdedor del partido número ## (cuando se jugó).
// Es idempotente: recalcula y completa lo que se pueda con los resultados actuales.

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Orden de posiciones: puntos, luego diferencia de gol, luego goles a favor.
// (Los desempates finos de FIFA —head-to-head, fair play— se omiten; cubre el 99%.)
function ordenar(a, b) {
  if (b.pts !== a.pts) return b.pts - a.pts
  const dgA = a.gf - a.ga
  const dgB = b.gf - b.ga
  if (dgB !== dgA) return dgB - dgA
  if (b.gf !== a.gf) return b.gf - a.gf
  return a.equipo.nombre.localeCompare(b.equipo.nombre) // determinístico
}

// Posiciones de un grupo SOLO si está completo (6 partidos jugados); si no, null.
function posicionesGrupo(equiposGrupo, partidosGrupo) {
  const jugados = partidosGrupo.filter((p) => p.estado === 'jugado')
  if (jugados.length < 6) return null

  const stats = {}
  for (const e of equiposGrupo) stats[String(e._id)] = { equipo: e, pts: 0, gf: 0, ga: 0 }

  for (const p of jugados) {
    const L = stats[String(p.equipoLocal)]
    const V = stats[String(p.equipoVisitante)]
    if (!L || !V) continue
    L.gf += p.golesLocal
    L.ga += p.golesVisitante
    V.gf += p.golesVisitante
    V.ga += p.golesLocal
    if (p.golesLocal > p.golesVisitante) L.pts += 3
    else if (p.golesLocal < p.golesVisitante) V.pts += 3
    else {
      L.pts += 1
      V.pts += 1
    }
  }
  return Object.values(stats).sort(ordenar)
}

// Asigna los 8 mejores terceros a los slots "3.../..." respetando los grupos
// elegibles de cada slot (matching válido por backtracking).
// NOTA: es UNA asignación válida, no necesariamente la exacta de la tabla oficial
// de FIFA (que no se puede verificar acá). Al cierre de grupos conviene contrastar
// con el cuadro oficial y, si hace falta, ajustar a mano.
function asignarTerceros(top8, partidosKO, slot) {
  const elegiblesPorSlot = {}
  for (const p of partidosKO) {
    for (const s of [p.slotLocal, p.slotVisitante]) {
      if (s && /^3[A-L](\/[A-L])+$/.test(s)) elegiblesPorSlot[s] = s.slice(1).split('/')
    }
  }
  const slots = Object.entries(elegiblesPorSlot).map(([s, elegibles]) => ({ s, elegibles }))
  const terceros = top8.map((t) => ({ grupo: t.grupo, id: t.stat.equipo._id }))

  const usados = new Set()
  const asign = {}
  function bt(i) {
    if (i === slots.length) return true
    for (const t of terceros) {
      if (usados.has(t.grupo)) continue
      if (!slots[i].elegibles.includes(t.grupo)) continue
      usados.add(t.grupo)
      asign[slots[i].s] = t.id
      if (bt(i + 1)) return true
      usados.delete(t.grupo)
      delete asign[slots[i].s]
    }
    return false
  }
  bt(0)
  for (const [s, id] of Object.entries(asign)) slot[s] = id
}

// Recalcula y completa los equipos de las eliminatorias con los resultados actuales.
// Devuelve cuántos slots se completaron en esta pasada.
async function resolverBracket() {
  const [equipos, partidos] = await Promise.all([Equipo.find(), Partido.find()])

  const porGrupo = {}
  for (const e of equipos) {
    if (!porGrupo[e.grupo]) porGrupo[e.grupo] = []
    porGrupo[e.grupo].push(e)
  }

  const partidosGrupos = partidos.filter((p) => p.fase === 'grupos')
  const ko = partidos.filter((p) => p.fase !== 'grupos')

  const slot = {} // "1A"/"2B"/"3.../"/"W##"/"L##" -> equipoId
  const terceros = []

  // 1) 1° y 2° de cada grupo completo (+ junta los terceros)
  for (const letra of GRUPOS) {
    const eg = porGrupo[letra] || []
    const pg = partidosGrupos.filter(
      (p) =>
        eg.some((e) => e._id.equals(p.equipoLocal)) &&
        eg.some((e) => e._id.equals(p.equipoVisitante))
    )
    const pos = posicionesGrupo(eg, pg)
    if (!pos) continue
    slot['1' + letra] = pos[0].equipo._id
    slot['2' + letra] = pos[1].equipo._id
    terceros.push({ grupo: letra, stat: pos[2] })
  }

  // 2) 8 mejores terceros (solo con los 12 grupos completos)
  if (terceros.length === 12) {
    const top8 = [...terceros].sort((x, y) => ordenar(x.stat, y.stat)).slice(0, 8)
    asignarTerceros(top8, ko, slot)
  }

  // 3) ganador/perdedor de cada KO ya jugado (con resultado NO empatado;
  //    un empate necesitaría penales, que hoy no se modelan -> se deja pendiente)
  for (const p of ko) {
    if (p.estado !== 'jugado' || p.numero == null) continue
    if (!p.equipoLocal || !p.equipoVisitante) continue
    if (p.golesLocal === p.golesVisitante) continue
    const localGana = p.golesLocal > p.golesVisitante
    slot['W' + p.numero] = localGana ? p.equipoLocal : p.equipoVisitante
    slot['L' + p.numero] = localGana ? p.equipoVisitante : p.equipoLocal
  }

  // 4) aplica los slots resueltos a los partidos KO que todavía no tienen equipo
  let cambios = 0
  for (const p of ko) {
    let toca = false
    if (!p.equipoLocal && p.slotLocal && slot[p.slotLocal]) {
      p.equipoLocal = slot[p.slotLocal]
      toca = true
    }
    if (!p.equipoVisitante && p.slotVisitante && slot[p.slotVisitante]) {
      p.equipoVisitante = slot[p.slotVisitante]
      toca = true
    }
    if (toca) {
      await p.save()
      cambios++
    }
  }
  return cambios
}

module.exports = { resolverBracket, posicionesGrupo }
