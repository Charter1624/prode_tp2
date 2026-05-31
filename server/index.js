require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const logger = require('./services/logger')

// Bootstrap del servidor: conecta a Mongo y recién ahí escucha.
// La configuración de la app Express vive en app.js.

const PORT = process.env.PORT || 3000

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => logger.info(`Servidor en http://localhost:${PORT}`))
  } catch (err) {
    logger.error('Fallo al iniciar', { error: err.message })
    process.exit(1)
  }
}

start()
