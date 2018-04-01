const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const questionResponse = require('./shared.js').questionResponse

const respondentSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'email',
    trim: true
  },
  cohort: {
    type: ObjectId,
    required: true
  },
  demographicQuestionResponses: [questionResponse]
})

const Respondent = mongoose.model('Respondent', respondentSchema)

module.exports = Respondent
