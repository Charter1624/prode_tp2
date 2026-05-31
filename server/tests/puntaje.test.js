const { calcularPuntos, REGLAS, signo } = require('../services/puntaje')

// Test de la lógica de puntaje (Unidad de Testing / SSDLC). Es lógica pura,
// así que se prueba sin base ni servidor. Si alguien toca las reglas y rompe
// el ranking, estos tests lo cantan.

describe('calcularPuntos', () => {
  test('marcador exacto suma 3', () => {
    expect(calcularPuntos({ golesLocal: 2, golesVisitante: 1 }, { golesLocal: 2, golesVisitante: 1 })).toBe(3)
  })

  test('acertar al ganador local sin el marcador suma 1', () => {
    expect(calcularPuntos({ golesLocal: 2, golesVisitante: 1 }, { golesLocal: 1, golesVisitante: 0 })).toBe(1)
  })

  test('acertar al ganador visitante sin el marcador suma 1', () => {
    expect(calcularPuntos({ golesLocal: 0, golesVisitante: 3 }, { golesLocal: 1, golesVisitante: 2 })).toBe(1)
  })

  test('acertar el empate sin el marcador suma 1', () => {
    expect(calcularPuntos({ golesLocal: 1, golesVisitante: 1 }, { golesLocal: 2, golesVisitante: 2 })).toBe(1)
  })

  test('errar el resultado suma 0', () => {
    expect(calcularPuntos({ golesLocal: 2, golesVisitante: 1 }, { golesLocal: 0, golesVisitante: 2 })).toBe(0)
  })

  test('predecir empate cuando ganó local suma 0', () => {
    expect(calcularPuntos({ golesLocal: 1, golesVisitante: 0 }, { golesLocal: 1, golesVisitante: 1 })).toBe(0)
  })

  // Bordes
  test('0-0 exacto suma 3', () => {
    expect(calcularPuntos({ golesLocal: 0, golesVisitante: 0 }, { golesLocal: 0, golesVisitante: 0 })).toBe(3)
  })

  test('goleada exacta suma 3', () => {
    expect(calcularPuntos({ golesLocal: 5, golesVisitante: 0 }, { golesLocal: 5, golesVisitante: 0 })).toBe(3)
  })

  test('empate real 0-0 con pronóstico 1-1 (empate, otro marcador) suma 1', () => {
    expect(calcularPuntos({ golesLocal: 0, golesVisitante: 0 }, { golesLocal: 1, golesVisitante: 1 })).toBe(1)
  })

  test('las reglas son 3 / 1 / 0', () => {
    expect(REGLAS).toEqual({ EXACTO: 3, RESULTADO: 1, ERRADO: 0 })
  })
})

describe('signo (resultado 1-X-2)', () => {
  test('gana local devuelve 1', () => expect(signo(2, 0)).toBe(1))
  test('gana visitante devuelve -1', () => expect(signo(0, 2)).toBe(-1))
  test('empate devuelve 0', () => expect(signo(1, 1)).toBe(0))
})
