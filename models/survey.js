let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

const shared = require('./shared.js')

// Require SurveySet for getting Cohort Members
const SurveySet = require('./surveySet.js')

let surveySchema = mongoose.Schema({
  surveySet: {
    type: ObjectId,
    ref: 'SurveySet',
    required: true
  },
  cohort: {
    type: ObjectId,
    ref: 'Cohort',
    required: true
  },
  owner: {
    type: String,
    ref: 'User',
    required: true
  },
  sendDate: {
    type: Date,
    required: true
  },
  sent: {
    type: Boolean,
    required: true,
    default: false
  },
  questions: [shared.question]
})

surveySchema.method('getCohortMembers', function (callback) {
  SurveySet.aggregate([
    {
      $match: {
        _id: this.surveySet
      }
    },
    {
      $lookup: {
        from: 'cohorts', localField: 'cohort', foreignField: '_id', as: 'cohort'
      }
    },
    {
      $project: {
        'cohort.members': 1
      }
    }
  ], function (err, result) {
    if (err) {
      return callback(err)
    }
    // console.log('aggregate results ', result)
    if (result && result[0] && result[0].cohort && result[0].cohort[0]) {
      callback(null, result[0].cohort[0].members)
    }
  })
})

const Survey = mongoose.model('Survey', surveySchema)

module.exports = Survey
