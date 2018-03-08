const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

let responseSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'respondent',
    trim: true
  },
  survey: {
    type: ObjectId,
    required: true
  },
  surveySet: {
    type: ObjectId,
    required: true
  },
  cohort: {
    type: ObjectId,
    required: true
  },
  responseTime: {
    type: Date,
    required: true
  }
})

const Response = mongoose.model('Response', responseSchema)

module.exports = Response
