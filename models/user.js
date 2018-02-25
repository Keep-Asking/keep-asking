let mongoose = require('mongoose')

let userSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'username'
  }
})

let User = mongoose.model('User', userSchema)

module.exports = User
