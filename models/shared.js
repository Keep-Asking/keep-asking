const Mixed = require('mongoose').Schema.Types.Mixed

const requiredTrimmedString = {
  type: String,
  required: true,
  trim: true
}

const question = {
  title: requiredTrimmedString,
  id: requiredTrimmedString,
  kind: {
    type: String,
    enum: ['text', 'scale', 'choice', 'rank']
  },
  options: [String],
  textAreaSize: {
    type: String,
    enum: ['small', 'large'],
    default: 'small'
  },
  multipleChoice: Boolean
}

const questionResponse = {
  id: requiredTrimmedString,
  answer: {
    type: Mixed,
    required: true
  }
}

module.exports = {
  question,
  requiredTrimmedString,
  questionResponse
}
