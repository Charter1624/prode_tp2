const mongoose = require('mongoose')

// Un partido del Mundial. Fase de grupos: referencia dos `Equipo`. Eliminatorias:
// arrancan con SLOTS (ej "2A" = 2° del grupo A, "W73" = ganador del partido 73)
// y los equipos quedan en null hasta que la resolución del cuadro los completa.

const FASES = ['grupos', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'tercer-puesto', 'final']
const ESTADOS = ['pendiente', 'jugado']

const PartidoSchema = new mongoose.Schema(
  {
    // Equipos: presentes siempre en grupos; en eliminatorias se completan al resolverse.
    equipoLocal: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo' },
    equipoVisitante: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo' },
    // Slots de eliminatoria (hasta que se resuelven a equipos reales).
    slotLocal: { type: String },
    slotVisitante: { type: String },
    // Número de partido (para resolver los "W##"/"L##" de las rondas siguientes).
    numero: { type: Number },
    fecha: { type: Date, required: true },
    fase: { type: String, enum: FASES, default: 'grupos' },
    golesLocal: { type: Number, default: null, min: 0 },
    golesVisitante: { type: Number, default: null, min: 0 },
    estado: { type: String, enum: ESTADOS, default: 'pendiente' },
  },
  { timestamps: true }
)

PartidoSchema.pre('validate', function (next) {
  // Un partido de grupos necesita ambos equipos sí o sí.
  if (this.fase === 'grupos' && (!this.equipoLocal || !this.equipoVisitante)) {
    return next(new Error('Un partido de grupos necesita ambos equipos'))
  }
  // Un equipo no puede jugar contra sí mismo.
  if (this.equipoLocal && this.equipoVisitante && this.equipoLocal.equals(this.equipoVisitante)) {
    return next(new Error('El equipo local y el visitante no pueden ser el mismo'))
  }
  next()
})

module.exports = mongoose.model('Partido', PartidoSchema)
module.exports.FASES = FASES
module.exports.ESTADOS = ESTADOS
