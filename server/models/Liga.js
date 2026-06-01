const mongoose = require('mongoose')

// Una liga privada: un grupo de amigos que compite con la MISMA data del
// Mundial. No cambia los pronósticos (esos son del usuario, compartidos entre
// todas sus ligas): la liga solo agrupa miembros y da una tabla propia.

const LigaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    // Código de invitación: cripto-aleatorio y único. Se comparte para sumarse.
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    miembros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Liga', LigaSchema)
