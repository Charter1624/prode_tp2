const mongoose = require('mongoose')

// Una selección del Mundial. Antes los equipos eran strings sueltos dentro
// de Partido; ahora son su propia entidad, con el código de país para la
// bandera (flagcdn) y el grupo. Partido los referencia.

const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

const EquipoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    // Código ISO del país (ej: "ar", "br", "gb-eng"). Se usa para la bandera:
    // https://flagcdn.com/w80/<codigoPais>.png
    codigoPais: { type: String, required: true, unique: true, lowercase: true, trim: true },
    grupo: { type: String, enum: GRUPOS, uppercase: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Equipo', EquipoSchema)
module.exports.GRUPOS = GRUPOS
