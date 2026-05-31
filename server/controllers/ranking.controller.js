const { obtenerRanking } = require('../services/ranking.service')

// GET /api/ranking — tabla de posiciones (pública). La lógica del armado
// vive en el service; el controller solo la expone.
async function listar(req, res) {
  const ranking = await obtenerRanking()
  res.json(ranking)
}

module.exports = { listar }
