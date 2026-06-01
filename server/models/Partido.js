const mongoose = require('mongoose')

// Un partido del Mundial. Ahora referencia dos `Equipo` (antes eran strings).
// Los goles arrancan en null y el estado en "pendiente"; cuando el admin carga
// el resultado pasan a número y el estado a "jugado" (dispara el recálculo).

const FASES = ['grupos', 'octavos', 'cuartos', 'semifinal', 'tercer-puesto', 'final']
const ESTADOS = ['pendiente', 'jugado']

const PartidoSchema = new mongoose.Schema(
  {
    equipoLocal: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    equipoVisitante: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    fecha: { type: Date, required: true },
    fase: { type: String, enum: FASES, default: 'grupos' },
    golesLocal: { type: Number, default: null, min: 0 },
    golesVisitante: { type: Number, default: null, min: 0 },
    estado: { type: String, enum: ESTADOS, default: 'pendiente' },
  },
  { timestamps: true }
)

// Restricción: un equipo no puede jugar contra sí mismo.
PartidoSchema.pre('validate', function (next) {
  if (this.equipoLocal && this.equipoVisitante && this.equipoLocal.equals(this.equipoVisitante)) {
    return next(new Error('El equipo local y el visitante no pueden ser el mismo'))
  }
  next()
})

module.exports = mongoose.model('Partido', PartidoSchema)
module.exports.FASES = FASES
module.exports.ESTADOS = ESTADOS
