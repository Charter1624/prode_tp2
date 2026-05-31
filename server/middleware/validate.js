// Wrapper para validar req.body con un schema de Zod.
// Si falla, devuelve 400 con el detalle por campo. Si pasa, reemplaza
// req.body por los datos ya parseados (y sin claves de más).

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const detalles = result.error.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      }))
      return res.status(400).json({ error: 'Datos inválidos', detalles })
    }
    req.body = result.data
    next()
  }
}

module.exports = validate
