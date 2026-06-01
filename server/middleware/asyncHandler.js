// Envuelve un handler async para que, si la promesa rechaza, el error vaya
// al error handler de Express. En Express 4 esto NO pasa solo: un throw/reject
// dentro de un handler async deja la request colgada. Con esto, cualquier
// error inesperado (DB caída, etc.) termina en un 500 limpio.

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = asyncHandler
