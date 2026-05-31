const { z } = require('zod')
const { FASES } = require('../models/Partido')

// Schemas de validación con Zod. El middleware validate(schema) los corre
// contra req.body y, si pasan, reemplaza req.body por los datos parseados.
// Clave de seguridad: z.object() DESCARTA las claves de más, así que aunque
// alguien mande { admin: true } en el register, nunca llega al modelo.

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'id inválido')
const goles = z.number().int().min(0).max(30)

// --- Auth -----------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// --- Partidos (admin) -----------------------------------------------------
const crearPartidoSchema = z.object({
  equipoLocal: z.string().min(1).max(60),
  equipoVisitante: z.string().min(1).max(60),
  fecha: z.coerce.date(), // acepta ISO string y lo convierte a Date
  fase: z.enum(FASES).optional(),
})

const resultadoSchema = z.object({
  golesLocal: goles,
  golesVisitante: goles,
})

// --- Pronósticos ----------------------------------------------------------
const pronosticoSchema = z.object({
  partidoId: objectId,
  golesLocal: goles,
  golesVisitante: goles,
})

module.exports = {
  registerSchema,
  loginSchema,
  crearPartidoSchema,
  resultadoSchema,
  pronosticoSchema,
}
