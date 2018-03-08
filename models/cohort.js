let mongoose = require('mongoose')

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
  archived: Boolean
})

let Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
