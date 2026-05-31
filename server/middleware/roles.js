// Control de rol. Va siempre DESPUÉS de authMiddleware (necesita req.user).
// La validación de admin se hace en el server, no solo ocultando el tab en
// la app: si no, cualquiera con el token podría pegarle a las rutas de admin.

const soloAdmin = (req, res, next) => {
  if (!req.user?.admin) {
    return res.status(403).json({ error: 'Acceso restringido al administrador' })
  }
  next()
}

module.exports = { soloAdmin }
