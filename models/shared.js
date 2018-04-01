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
    enum: ['text', 'scale', 'choice']
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

const arrayContainsElementWithValue = function (array, path, value) {
  if (!array) return false
  for (const element of array) {
    if (element[path] === value) {
      return true
    }
  }
  return false
}

module.exports = {
  question,
  requiredTrimmedString,
  questionResponse,
  arrayContainsElementWithValue
}
