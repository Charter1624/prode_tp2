const nodemailer = require('nodemailer')
const logger = require('./logger')

// Envío de mails. Si hay SMTP configurado en .env, manda de verdad; si no,
// modo DEV: loguea el contenido del mail (sirve para probar el flujo de reset
// sin tener un servidor de correo todavía).
//
// Para producción, configurá en .env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// (ej. Gmail con una "app password", o un servicio como Resend/Brevo).

let transporter = null
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function enviarMail(to, asunto, texto) {
  if (!transporter) {
    logger.info(`[MAIL DEV — sin SMTP] Para: ${to} | Asunto: ${asunto}\n${texto}`)
    return
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: asunto,
    text: texto,
  })
}

module.exports = { enviarMail }
