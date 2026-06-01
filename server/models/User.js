const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Usuario del prode. name / email / password (hasheada) / admin / profilePic.
// El email es la identidad (no se cambia). Los campos reset* son para el flujo
// de recuperar/cambiar contraseña por mail (no se exponen: select:false).

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    admin: { type: Boolean, default: false },
    profilePic: { type: String }, // foto de perfil (data URI o URL)
    resetToken: { type: String, select: false }, // hash del código de reset
    resetExpira: { type: Date, select: false },
  },
  { timestamps: true }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.compararPassword = function (candidata) {
  return bcrypt.compare(candidata, this.password)
}

UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetToken
  delete obj.resetExpira
  return obj
}

module.exports = mongoose.model('User', UserSchema)
