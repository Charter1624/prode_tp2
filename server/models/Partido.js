const mongoose = require('mongoose')

// Un partido del Mundial. Los goles arrancan en null y el estado en
// "pendiente"; cuando el admin carga el resultado pasan a número y
// el estado a "jugado" (eso dispara el recálculo de puntos).

const FASES = ['grupos', 'octavos', 'cuartos', 'semifinal', 'tercer-puesto', 'final']
const ESTADOS = ['pendiente', 'jugado']

const PartidoSchema = new mongoose.Schema(
  {
    equipoLocal: { type: String, required: true, trim: true },
    equipoVisitante: { type: String, required: true, trim: true },
    fecha: { type: Date, required: true },
    fase: { type: String, enum: FASES, default: 'grupos' },
    golesLocal: { type: Number, default: null },
    golesVisitante: { type: Number, default: null },
    estado: { type: String, enum: ESTADOS, default: 'pendiente' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Partido', PartidoSchema)
module.exports.FASES = FASES
module.exports.ESTADOS = ESTADOS
