let mongoose = require('mongoose')

const requiredTrimmedString = {
  type: String,
  required: true,
  trim: true
}

let cohortSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  members: [String],
  archived: Boolean,
  demographicQuestions: [
    {
      title: requiredTrimmedString,
      id: requiredTrimmedString,
      kind: {
        type: String,
        enum: ['text', 'scale', 'choice']
      },
      options: [String]
    }
  ]
})

let Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
