const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const logger = require('./services/logger')

// La app Express: middleware, montaje de rutas y error handler.
// NO conecta a la base ni escucha un puerto — eso lo hace index.js (bootstrap).
// Separar la app del arranque permite testearla (supertest) sin levantar server.

const app = express()

// Seguridad base
app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:8081',
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(mongoSanitize())

// Rate limit general (además del más estricto en /auth y /ligas/unirse)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

// Rutas. El ranking general NO se expone público (filtraría a todos los usuarios):
// el ranking es por liga y solo lo ven sus miembros (ver routes/ligas).
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/equipos', require('./routes/equipos'))
app.use('/api/partidos', require('./routes/partidos'))
app.use('/api/pronosticos', require('./routes/pronosticos'))
app.use('/api/ligas', require('./routes/ligas'))

// Error handler central. Va al final, con los 4 argumentos (err, req, res, next)
// para que Express lo reconozca como manejador de errores.
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido en el body' })
  }
  logger.error(err.message, { stack: err.stack })
  res.status(500).json({ error: 'Error interno del servidor' })
})

module.exports = app
