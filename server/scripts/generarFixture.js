// Genera el fixture del Mundial 2026 a partir de los datos públicos de
// OpenFootball (sin API key) y lo guarda como seeds/fixture2026.json en NUESTRO
// formato (equipos + partidos de fase de grupos, traducidos al español y con el
// código de país para la bandera). Las eliminatorias se omiten (vienen con
// placeholders tipo "2A"/"Winner..." hasta que se sepan los clasificados).
//
// Correr con:  node scripts/generarFixture.js   (desde server/)

const fs = require('fs')
const path = require('path')

const FUENTE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

// Nombre (inglés, como viene de OpenFootball) -> { nombre español, código ISO para flagcdn }
const MAPA = {
  Mexico: { nombre: 'México', codigoPais: 'mx' },
  'South Africa': { nombre: 'Sudáfrica', codigoPais: 'za' },
  'South Korea': { nombre: 'Corea del Sur', codigoPais: 'kr' },
  'Czech Republic': { nombre: 'República Checa', codigoPais: 'cz' },
  Canada: { nombre: 'Canadá', codigoPais: 'ca' },
  'Bosnia & Herzegovina': { nombre: 'Bosnia y Herzegovina', codigoPais: 'ba' },
  Qatar: { nombre: 'Catar', codigoPais: 'qa' },
  Switzerland: { nombre: 'Suiza', codigoPais: 'ch' },
  Brazil: { nombre: 'Brasil', codigoPais: 'br' },
  Morocco: { nombre: 'Marruecos', codigoPais: 'ma' },
  Haiti: { nombre: 'Haití', codigoPais: 'ht' },
  Scotland: { nombre: 'Escocia', codigoPais: 'gb-sct' },
  USA: { nombre: 'Estados Unidos', codigoPais: 'us' },
  Paraguay: { nombre: 'Paraguay', codigoPais: 'py' },
  Australia: { nombre: 'Australia', codigoPais: 'au' },
  Turkey: { nombre: 'Turquía', codigoPais: 'tr' },
  Germany: { nombre: 'Alemania', codigoPais: 'de' },
  'Curaçao': { nombre: 'Curazao', codigoPais: 'cw' },
  'Ivory Coast': { nombre: 'Costa de Marfil', codigoPais: 'ci' },
  Ecuador: { nombre: 'Ecuador', codigoPais: 'ec' },
  Netherlands: { nombre: 'Países Bajos', codigoPais: 'nl' },
  Japan: { nombre: 'Japón', codigoPais: 'jp' },
  Sweden: { nombre: 'Suecia', codigoPais: 'se' },
  Tunisia: { nombre: 'Túnez', codigoPais: 'tn' },
  Belgium: { nombre: 'Bélgica', codigoPais: 'be' },
  Egypt: { nombre: 'Egipto', codigoPais: 'eg' },
  Iran: { nombre: 'Irán', codigoPais: 'ir' },
  'New Zealand': { nombre: 'Nueva Zelanda', codigoPais: 'nz' },
  Spain: { nombre: 'España', codigoPais: 'es' },
  'Cape Verde': { nombre: 'Cabo Verde', codigoPais: 'cv' },
  'Saudi Arabia': { nombre: 'Arabia Saudita', codigoPais: 'sa' },
  Uruguay: { nombre: 'Uruguay', codigoPais: 'uy' },
  France: { nombre: 'Francia', codigoPais: 'fr' },
  Senegal: { nombre: 'Senegal', codigoPais: 'sn' },
  Iraq: { nombre: 'Irak', codigoPais: 'iq' },
  Norway: { nombre: 'Noruega', codigoPais: 'no' },
  Argentina: { nombre: 'Argentina', codigoPais: 'ar' },
  Algeria: { nombre: 'Argelia', codigoPais: 'dz' },
  Austria: { nombre: 'Austria', codigoPais: 'at' },
  Jordan: { nombre: 'Jordania', codigoPais: 'jo' },
  Portugal: { nombre: 'Portugal', codigoPais: 'pt' },
  'DR Congo': { nombre: 'RD del Congo', codigoPais: 'cd' },
  Uzbekistan: { nombre: 'Uzbekistán', codigoPais: 'uz' },
  Colombia: { nombre: 'Colombia', codigoPais: 'co' },
  England: { nombre: 'Inglaterra', codigoPais: 'gb-eng' },
  Croatia: { nombre: 'Croacia', codigoPais: 'hr' },
  Ghana: { nombre: 'Ghana', codigoPais: 'gh' },
  Panama: { nombre: 'Panamá', codigoPais: 'pa' },
}

// "2026-06-11" + "13:00 UTC-6" -> ISO UTC
function toISO(date, time) {
  const m = (time || '').match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})/)
  if (!m) return new Date(`${date}T12:00:00Z`).toISOString()
  const [, hh, mm, off] = m
  const n = parseInt(off, 10)
  const offStr = (n < 0 ? '-' : '+') + String(Math.abs(n)).padStart(2, '0') + ':00'
  return new Date(`${date}T${hh.padStart(2, '0')}:${mm}:00${offStr}`).toISOString()
}

async function main() {
  const res = await fetch(FUENTE)
  if (!res.ok) throw new Error(`No se pudo bajar el fixture (HTTP ${res.status})`)
  const data = await res.json()

  const equiposMap = {} // nombre español -> { nombre, codigoPais, grupo }
  const partidos = []
  const faltantes = new Set()

  for (const m of data.matches) {
    if (!m.group) continue // solo fase de grupos (las eliminatorias tienen placeholders)
    const a = MAPA[m.team1]
    const b = MAPA[m.team2]
    if (!a) faltantes.add(m.team1)
    if (!b) faltantes.add(m.team2)
    if (!a || !b) continue

    const grupo = m.group.replace('Group ', '').trim() // "Group A" -> "A"
    equiposMap[a.nombre] = { nombre: a.nombre, codigoPais: a.codigoPais, grupo }
    equiposMap[b.nombre] = { nombre: b.nombre, codigoPais: b.codigoPais, grupo }

    partidos.push({
      local: a.nombre,
      visitante: b.nombre,
      fecha: toISO(m.date, m.time),
      grupo,
      fase: 'grupos',
    })
  }

  const equipos = Object.values(equiposMap).sort((x, y) =>
    x.grupo === y.grupo ? x.nombre.localeCompare(y.nombre) : x.grupo.localeCompare(y.grupo)
  )

  const salida = { fuente: FUENTE, equipos, partidos }
  const dest = path.join(__dirname, '..', 'seeds', 'fixture2026.json')
  fs.writeFileSync(dest, JSON.stringify(salida, null, 2))

  console.log(`Equipos: ${equipos.length} | Partidos (grupos): ${partidos.length}`)
  console.log(`Escrito en: ${dest}`)
  if (faltantes.size) {
    console.log(`⚠️ Equipos sin mapear (se omitieron sus partidos): ${[...faltantes].join(', ')}`)
  }
}

main().catch((e) => {
  console.error('Falló:', e.message)
  process.exit(1)
})
