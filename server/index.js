require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const logger = require('./services/logger')

// Bootstrap del servidor: valida la config mínima, conecta a Mongo y escucha.
// La configuración de la app Express vive en app.js.

const PORT = process.env.PORT || 3000

// Fail-fast: si falta una variable crítica conviene reventar al arrancar y no
// fallar raro en runtime (un JWT sin secreto sería un agujero de seguridad).
function validarEnv() {
  const faltan = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k])
  if (faltan.length) {
    throw new Error(`Faltan variables de entorno: ${faltan.join(', ')} (revisá tu .env)`)
  }
}

async function start() {
  try {
    validarEnv()
    await connectDB()
    app.listen(PORT, () => logger.info(`Servidor en http://localhost:${PORT}`))
  } catch (err) {
    logger.error('Fallo al iniciar', { error: err.message })
    process.exit(1)
  }
}

start()
