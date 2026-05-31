// El corazón del prode: cuántos puntos vale un pronóstico contra el resultado
// real. Es LÓGICA PURA (entra un resultado y un pronóstico, sale un número),
// sin tocar la base ni la red, justamente para poder testearla con Jest
// (ver tests/puntaje.test.js). Las reglas viven todas acá, en un solo lugar,
// para poder cambiarlas sin tocar el resto del backend.

const REGLAS = {
  EXACTO: 3, // acertó los goles de ambos equipos
  RESULTADO: 1, // acertó quién gana (o empate) pero no el marcador
  ERRADO: 0,
}

// Resultado 1-X-2 como signo: 1 gana local, -1 gana visitante, 0 empate.
function signo(golesLocal, golesVisitante) {
  return Math.sign(golesLocal - golesVisitante)
}

// real / pronostico = objetos con { golesLocal, golesVisitante } (números).
function calcularPuntos(real, pronostico) {
  const exacto =
    real.golesLocal === pronostico.golesLocal &&
    real.golesVisitante === pronostico.golesVisitante
  if (exacto) return REGLAS.EXACTO

  const mismoResultado =
    signo(real.golesLocal, real.golesVisitante) ===
    signo(pronostico.golesLocal, pronostico.golesVisitante)
  if (mismoResultado) return REGLAS.RESULTADO

  return REGLAS.ERRADO
}

module.exports = { REGLAS, calcularPuntos, signo }
