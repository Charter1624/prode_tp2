require('dotenv').config()
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = require('../models/User')

// Prueba el flujo de reset de contraseña (requiere el server corriendo en :3000).
// Setea un código conocido directo en la base para no depender del mail.
// Restaura la contraseña original al final.

const base = 'http://localhost:3000/api'
const J = (r) => r.json()
const post = (p, b) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
const hash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex')

async function main() {
  await mongoose.connect(process.env.MONGO_URI)
  const email = 'tincho@prode.com'

  const f = await post('/auth/forgot', { email })
  console.log('1) forgot ->', f.status, '(debe 200)')
  const u1 = await User.findOne({ email }).select('+resetToken')
  console.log('   token de reset guardado:', u1.resetToken ? 'sí' : 'no')

  // Seteo un código conocido para poder probar el reset por API.
  const u = await User.findOne({ email })
  u.resetToken = hash('123456')
  u.resetExpira = new Date(Date.now() + 15 * 60000)
  await u.save()

  const rBad = await post('/auth/reset', { email, codigo: '000000', password: 'nuevaclave1' })
  console.log('2) reset con código INCORRECTO ->', rBad.status, '(debe 400)')

  const rOk = await post('/auth/reset', { email, codigo: '123456', password: 'nuevaclave1' })
  console.log('3) reset con código correcto ->', rOk.status, '(debe 200)')

  const login = await J(await post('/auth/login', { email, password: 'nuevaclave1' }))
  console.log('4) login con la NUEVA contraseña ->', login.token ? 'OK (cambió)' : 'FALLO')

  // Restaurar la contraseña original del seed.
  const ur = await User.findOne({ email })
  ur.password = 'prode1234'
  await ur.save()
  console.log('5) contraseña restaurada a prode1234')

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('Falló:', e.message)
  process.exit(1)
})
