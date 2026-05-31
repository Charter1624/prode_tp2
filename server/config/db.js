const mongoose = require('mongoose')
const logger = require('../services/logger')

// Conexión a MongoDB vía Mongoose. La URI vive en .env (MONGO_URI).
// La llama index.js en el arranque, antes de escuchar el puerto.

async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI no definido en .env')

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  logger.info(`MongoDB conectado: ${mongoose.connection.name}`)
}

module.exports = connectDB
