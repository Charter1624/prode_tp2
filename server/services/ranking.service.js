const User = require('../models/User')
const { REGLAS } = require('./puntaje')

// Arma el ranking con una agregación de Mongo (Unidad 5). Si se pasa `userIds`,
// lo limita a esos usuarios (ranking de una LIGA); si no, es el ranking general.
// `puntos` suma los pronósticos resueltos (los pendientes tienen puntos=null y
// $sum los ignora). Solo expone name/profilePic/puntos/exactos (nada sensible).

async function obtenerRanking(userIds = null) {
  const pipeline = []

  if (userIds && userIds.length) {
    pipeline.push({ $match: { _id: { $in: userIds } } })
  }

  pipeline.push(
    {
      $lookup: {
        from: 'pronosticos',
        localField: '_id',
        foreignField: 'userId',
        as: 'pronosticos',
      },
    },
    {
      $project: {
        name: 1,
        profilePic: 1,
        puntos: { $sum: '$pronosticos.puntos' },
        // exactos = cuántos pronósticos valieron el máximo; sirve de desempate.
        exactos: {
          $size: {
            $filter: {
              input: '$pronosticos',
              as: 'p',
              cond: { $eq: ['$$p.puntos', REGLAS.EXACTO] },
            },
          },
        },
      },
    },
    { $sort: { puntos: -1, exactos: -1, name: 1 } }
  )

  return User.aggregate(pipeline)
}

module.exports = { obtenerRanking }
