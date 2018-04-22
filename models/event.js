const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const options = {
  discriminatorKey: 'eventType'
}

const eventSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
}, options)
const Event = mongoose.model('Event', eventSchema)

const surveyRequestEmailSentEventSchema = new mongoose.Schema({
  respondent: {
    type: String,
    ref: 'Respondent',
    required: true,
    alias: 'recipient'
  },
  survey: {
    type: ObjectId,
    ref: 'Survey',
    required: true
  },
  surveySet: {
    type: ObjectId,
    ref: 'SurveySet',
    required: true
  },
  cohort: {
    type: ObjectId,
    ref: 'Cohort',
    required: true,
    index: true
  },
  transport: {
    type: String,
    trimmed: true
  }
}, options)
const SurveyRequestEmailSentEvent = Event.discriminator('SurveyRequestEmailSentEvent', surveyRequestEmailSentEventSchema)

const surveyOpenedEventSchema = new mongoose.Schema({
  respondent: {
    type: String,
    ref: 'Respondent',
    required: true,
    alias: 'recipient'
  },
  survey: {
    type: ObjectId,
    ref: 'Survey',
    required: true
  },
  surveySet: {
    type: ObjectId,
    ref: 'SurveySet',
    required: true
  },
  cohort: {
    type: ObjectId,
    ref: 'Cohort',
    required: true,
    index: true
  }
}, options)
const surveyOpenedEvent = Event.discriminator('SurveyOpenedEvent', surveyOpenedEventSchema)

const surveySubmittedEventSchema = new mongoose.Schema({
  response: {
    type: ObjectId,
    ref: 'Response',
    required: true
  },
  respondent: {
    type: String,
    ref: 'Respondent',
    required: true,
    alias: 'recipient'
  },
  survey: {
    type: ObjectId,
    ref: 'Survey',
    required: true
  },
  surveySet: {
    type: ObjectId,
    ref: 'SurveySet',
    required: true
  },
  cohort: {
    type: ObjectId,
    ref: 'Cohort',
    required: true,
    index: true
  }
}, options)
const surveySubmittedEvent = Event.discriminator('SurveySubmittedEvent', surveySubmittedEventSchema)
