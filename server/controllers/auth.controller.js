const jwt = require('jsonwebtoken')
const User = require('../models/User')
const logger = require('../services/logger')

// Lógica de autenticación. Las rutas (routes/auth.js) solo wirean estos
// handlers con su middleware (rate limit, validación).

// Helper: firma el JWT de sesión. Va el id y el flag admin (lo mínimo);
// el middleware lo verifica con JWT_SECRET en cada request protegido.
function emitirToken(user) {
  return jwt.sign(
    { userId: user._id, admin: user.admin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Normaliza el email para que la unicidad sea EXACTA (case-insensitive):
// "Foo@X.com " y "foo@x.com" cuentan como el mismo.
const normalizarEmail = (email) => String(email || '').toLowerCase().trim()

// POST /api/auth/register — crea un jugador y lo deja logueado (devuelve token).
// El schema ya descartó campos de más (p. ej. admin); solo llegan name/email/password.
async function register(req, res) {
  const { name, password } = req.body
  const email = normalizarEmail(req.body.email)
  try {
    const user = await User.create({ name, email, password })
    const token = emitirToken(user)
    res.status(201).json({ token, user: user.toJSON() })
  } catch (err) {
    // Índice único de email: no se pueden crear dos cuentas con el mismo mail.
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' })
    }
    throw err // lo levanta el error handler de app.js
  }
}

// POST /api/auth/login — valida credenciales y devuelve el JWT.
async function login(req, res) {
  const { password } = req.body
  const email = normalizarEmail(req.body.email)
  // La password tiene select:false en el modelo, hay que pedirla explícito.
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

  const token = emitirToken(user)
  res.json({ token, user: user.toJSON() })
}

// GET /api/auth/me — devuelve el usuario del token (rehidratar sesión).
async function me(req, res) {
  res.json(req.user.toJSON())
}

module.exports = { register, login, me }
