const { z } = require('zod')
const { FASES } = require('../models/Partido')
const { GRUPOS } = require('../models/Equipo')

// Schemas de validación con Zod. El middleware validate(schema) los corre
// contra req.body y, si pasan, reemplaza req.body por los datos parseados.
// z.object() DESCARTA las claves de más (no se puede colar admin:true en register).

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'id inválido')
const goles = z.number().int().min(0).max(30)
const email = z.string().trim().toLowerCase().email()

// --- Auth -----------------------------------------------------------------
const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email,
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  email,
  password: z.string().min(1),
})

const forgotSchema = z.object({ email })

const resetSchema = z.object({
  email,
  codigo: z.string().trim().length(6),
  password: z.string().min(6).max(100),
})

// Foto de perfil (data URI o URL). Cap de tamaño para no recibir imágenes enormes.
const actualizarPerfilSchema = z.object({
  profilePic: z.string().max(700000),
})

// --- Equipos (admin) ------------------------------------------------------
const crearEquipoSchema = z.object({
  nombre: z.string().min(2).max(60),
  codigoPais: z
    .string()
    .regex(/^[a-z]{2}(-[a-z]{2,3})?$/i, 'código de país inválido (ej: ar, br, gb-eng)'),
  grupo: z.enum(GRUPOS).optional(),
})

// --- Partidos (admin) -----------------------------------------------------
const crearPartidoSchema = z
  .object({
    equipoLocal: objectId,
    equipoVisitante: objectId,
    fecha: z.coerce.date(),
    fase: z.enum(FASES).optional(),
  })
  .refine((d) => d.equipoLocal !== d.equipoVisitante, {
    message: 'El equipo local y el visitante no pueden ser el mismo',
    path: ['equipoVisitante'],
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

// --- Ligas ----------------------------------------------------------------
const crearLigaSchema = z.object({
  nombre: z.string().min(2).max(60),
})

const unirseLigaSchema = z.object({
  codigo: z.string().trim().min(4).max(20),
})

module.exports = {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  actualizarPerfilSchema,
  crearEquipoSchema,
  crearPartidoSchema,
  resultadoSchema,
  pronosticoSchema,
  crearLigaSchema,
  unirseLigaSchema,
}
