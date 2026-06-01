const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const logger = require('../services/logger')
const { enviarMail } = require('../services/mailer')

// Lógica de autenticación. Las rutas (routes/auth.js) wirean estos handlers
// con su middleware (rate limit, validación).

function emitirToken(user) {
  return jwt.sign(
    { userId: user._id, admin: user.admin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Unicidad exacta: "Foo@X.com " y "foo@x.com" son el mismo email.
const normalizarEmail = (email) => String(email || '').toLowerCase().trim()
// Guardamos el código de reset hasheado (nunca en texto plano).
const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex')

// POST /api/auth/register — crea un jugador y lo deja logueado.
async function register(req, res) {
  const { name, password } = req.body
  const email = normalizarEmail(req.body.email)
  try {
    const user = await User.create({ name, email, password })
    res.status(201).json({ token: emitirToken(user), user: user.toJSON() })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' })
    }
    throw err
  }
}

// POST /api/auth/login — valida credenciales y devuelve el JWT.
async function login(req, res) {
  const { password } = req.body
  const email = normalizarEmail(req.body.email)
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    logger.warn('Login fallido — email no existe', { email })
    return res.status(401).json({ error: 'Credenciales incorrectas' })
  }
  const ok = await user.compararPassword(password)
  if (!ok) {
    logger.warn('Login fallido — password incorrecta', { email })
    return res.status(401).json({ error: 'Credenciales incorrectas' })
  }
  res.json({ token: emitirToken(user), user: user.toJSON() })
}

// GET /api/auth/me — devuelve el usuario del token.
async function me(req, res) {
  res.json(req.user.toJSON())
}

// POST /api/auth/forgot — manda un código al email para cambiar la contraseña.
// Siempre responde 200 (no revela si el email existe → no filtra usuarios).
async function forgot(req, res) {
  const email = normalizarEmail(req.body.email)
  const user = await User.findOne({ email })
  if (user) {
    const codigo = String(crypto.randomInt(100000, 1000000)) // 6 dígitos
    user.resetToken = hashToken(codigo)
    user.resetExpira = new Date(Date.now() + 15 * 60 * 1000) // 15 min
    await user.save()
    await enviarMail(
      email,
      'Cambiar contraseña — Prode Mundial',
      `Tu código para cambiar la contraseña es: ${codigo}\n\nVence en 15 minutos. Si no lo pediste, ignorá este mail.`
    )
  }
  res.json({ mensaje: 'Si el email existe, te enviamos un código para cambiar la contraseña.' })
}

// POST /api/auth/reset — cambia la contraseña con el código recibido por mail.
async function reset(req, res) {
  const email = normalizarEmail(req.body.email)
  const { codigo, password } = req.body
  const user = await User.findOne({ email }).select('+resetToken +resetExpira')

  const valido =
    user &&
    user.resetToken &&
    user.resetExpira &&
    user.resetExpira > new Date() &&
    user.resetToken === hashToken(codigo)

  if (!valido) {
    return res.status(400).json({ error: 'Código inválido o vencido' })
  }

  user.password = password // el pre-save lo hashea
  user.resetToken = undefined
  user.resetExpira = undefined
  await user.save()
  res.json({ mensaje: 'Contraseña actualizada. Ya podés iniciar sesión.' })
}

// PUT /api/auth/perfil — actualiza la foto de perfil (el email NO se cambia).
async function actualizarPerfil(req, res) {
  req.user.profilePic = req.body.profilePic
  await req.user.save()
  res.json(req.user.toJSON())
}

module.exports = { register, login, me, forgot, reset, actualizarPerfil }
