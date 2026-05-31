const mongoose = require('mongoose')

// El pronóstico de un usuario para un partido: su marcador apostado.
// Es, en el fondo, la relación N–N entre User y Partido con dato extra
// (el ejemplo de tabla intermedia de la Unidad 5).
//
// `puntos` queda en null hasta que el partido se juega; ahí el backend
// lo calcula y lo guarda (ver services/puntaje.js). Tenerlo cacheado
// acá hace que armar el ranking sea una simple suma.

const PronosticoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    partidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
    golesLocal: { type: Number, required: true, min: 0 },
    golesVisitante: { type: Number, required: true, min: 0 },
    puntos: { type: Number, default: null },
  },
  { timestamps: true }
)

// Un solo pronóstico por usuario por partido.
PronosticoSchema.index({ userId: 1, partidoId: 1 }, { unique: true })

module.exports = mongoose.model('Pronostico', PronosticoSchema)
