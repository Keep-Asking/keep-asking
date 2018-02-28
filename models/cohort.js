let mongoose = require('mongoose')

let cohortSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  members: [String]
})

let Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
