let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId
const Survey = require('./survey.js')

let surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  surveyURL: {
    type: String,
    lowercase: true,
    trim: true
  },
  sendDates: [Date]
})

// Manage creation of Survey objects when the surveySet is updated
let updateSurveysHandler = function (surveySet) {
  if (!surveySet.sendDates || !Array.isArray(surveySet.sendDates)) {
    return
  }

  Survey.remove({ // Remove any existing future surveys in this surveySet
    surveySet: surveySet._id,
    sent: false
  }).then(function () { // Create new Surveys for each of the sendDates
    let surveyDates = surveySet.sendDates
    let surveyDocuments = surveyDates.filter(function (date) {
      return (date instanceof Date && date >= new Date())
    }).map(function (date) {
      return {
        surveySet: surveySet._id,
        cohort: surveySet.cohort,
        sendDate: date,
        sent: false
      }
    })
    return Survey.insertMany(surveyDocuments)
  }).catch(function (err) {
    console.error('An error occured while automatically creating new surveys for an updated surveySet', err)
  })
}

// Bind the updateSurveysHandler to the `save` and `findOneAndUpdate` events
surveySetSchema.post('findOneAndUpdate', updateSurveysHandler)
surveySetSchema.post('update', updateSurveysHandler)
surveySetSchema.post('save', updateSurveysHandler)

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet

// let newSS = SurveySet({
//   cohort: '5a98495d42c721f1b7841c68',
//   name: 'Homework Survey',
//   surveyURL: 'https://www.example.com',
//   sendDates: [
//     new Date()
//   ]
// })

// console.log('About to save newSS')
// newSS.save(function (err) {
//   if (err) {
//     return console.error(err)
//   }
//   console.log('saved newSS')
// })

// SurveySet.findOneAndUpdate({
//   _id: '5aa05bed9a3f8acfd2c6729d'
// }, {
//   sendDates: [new Date(), new Date('2018-08-17T03:24:00'), new Date('2018-07-15T03:24:00')]
// }, {
//   upsert: true,
//   new: true
// }, function (err, doc) {
//   console.log(err, doc)
// })
