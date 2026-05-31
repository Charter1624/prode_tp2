const winston = require('winston')

// Logger central (winston). Se usa en todo el backend en vez de console.log
// para tener timestamp, nivel y poder cambiar el detalle desde LOG_LEVEL.

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
    })
  ),
  transports: [new winston.transports.Console()],
})

module.exports = logger
