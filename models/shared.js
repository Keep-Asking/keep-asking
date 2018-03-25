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
    enum: ['small', 'large']
  },
  multipleChoice: Boolean
}

module.exports = {
  question,
  requiredTrimmedString
}
