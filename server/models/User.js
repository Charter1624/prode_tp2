const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Usuario del prode. Campos según el plan (03-modelo-de-datos.md):
// name / email / password (hasheada) / admin (boolean) / profilePic.
// El frontend ya usa `user.admin` para mostrar el tab Admin, por eso es boolean.

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    admin: { type: Boolean, default: false },
    profilePic: { type: String }, // URL opcional (foto de perfil)
  },
  { timestamps: true }
)

// Hashea la password con bcrypt solo si cambió (alta o cambio de pass).
// Nunca se guarda en texto plano.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.compararPassword = function (candidata) {
  return bcrypt.compare(candidata, this.password)
}

// Al serializar a JSON nunca exponemos la password.
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', UserSchema)
