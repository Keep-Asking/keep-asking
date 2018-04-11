const nodemailer = require('nodemailer')
const sparkPostTransport = require('nodemailer-sparkpost-transport')
const mailgunTransport = require('nodemailer-mailgun-transport')
const fs = require('fs')
const ejs = require('ejs')
const assert = require('assert').strict

require('dotenv').config()
const config = require('./config.js')
require('./database.js')
const generateSurveyAccessHash = require('./hash.js').generateSurveyAccessHash

const Survey = require('./../models/survey.js')
const Response = require('./../models/response.js')
const emailTemplateSimplePlaintext = fs.readFileSync('./emails/surveyRequestSimplePlaintext.ejs', 'utf-8')
const emailTemplateSimpleHTML = fs.readFileSync('./emails/surveyRequestSimple.ejs', 'utf-8')

// Configure the third-party transport service
let thirdPartyTransport
if (config.transport === 'mailgun') {
  thirdPartyTransport = mailgunTransport({
    auth: {
      api_key: config.mailgun.apiKey,
      domain: config.mailgun.domain
    }
  })
} else {
  thirdPartyTransport = sparkPostTransport({
    options: {
      open_tracking: false,
      click_tracking: false,
      transactional: true
    }
  })
}
const mailer = nodemailer.createTransport(thirdPartyTransport)

const generateSurveyResponseRequestEmailConfiguration = function (cohort, surveySet, survey, recipientEmail) {
  // Generate the beautified email topic
  const emailTopic = surveySet.name.split(' ').filter(word => (!['survey', 'feedback'].includes(word.toLowerCase()))).join(' ')

  // Prepare the email data
  const emailData = {
    survey: survey,
    owner: cohort.owner,
    host: config.host,
    surveyURL: [config.host, 'cohorts', cohort._id, 'surveys', surveySet._id, 'respond', survey._id].join('/') + `?email=${encodeURIComponent(recipientEmail)}&hash=${generateSurveyAccessHash(cohort._id, surveySet._id, survey._id, recipientEmail)}`,
    emailTopic: emailTopic
  }

  // Render the HTML email
  const emailHTML = ejs.render(emailTemplateSimpleHTML, emailData)

  // Render the plaintext email
  const emailPlaintext = ejs.render(emailTemplateSimplePlaintext, emailData)

  const ownerFullName = [cohort.owner.name.givenName, cohort.owner.name.familyName].join(' ')
  const emailConfiguration = {
    from: {
      name: ownerFullName,
      address: ownerFullName.split(' ').join('.').toLowerCase() + '@' + config.OUTBOUND_EMAIL_DOMAIN
    },
    replyTo: {
      name: ownerFullName,
      address: cohort.owner.email
    },
    to: recipientEmail,
    subject: [cohort.name, emailTopic, 'Feedback'].join(' '),
    text: emailPlaintext,
    html: emailHTML
  }

  return emailConfiguration
}

const sendSurveyResponseRequestEmail = function (cohort, surveySet, survey, recipientEmail) {
  const emailConfiguration = generateSurveyResponseRequestEmailConfiguration(cohort, surveySet, survey, recipientEmail)
  if (process.env.SKIP_SENDING_EMAILS === 'true') {
    console.log('Skipping sending emails')
    console.log(emailConfiguration)
    return Promise.resolve(recipientEmail)
  }
  return mailer.sendMail(emailConfiguration)
}

const sendSurveyResponseRequestEmailToEmails = function (cohort, surveySet, survey, emails) {
  assert(emails && Array.isArray(emails))
  const surveyResponseRequestEmailSendingPromises = emails.map(cohortMember => {
    return sendSurveyResponseRequestEmail(cohort, surveySet, survey, cohortMember)
  })
  return Promise.all(surveyResponseRequestEmailSendingPromises)
}

const sendSurveyResponseRequestEmailToCohort = function (cohort, surveySet, survey) {
  assert(cohort.members && Array.isArray(cohort.members))
  return sendSurveyResponseRequestEmailToEmails(cohort, surveySet, survey, cohort.members)
}

const resendSurveyResponseRequestEmails = function (cohortID, surveySetID, surveyID) {
  const promises = [
    Response.find({
      cohort: cohortID,
      surveySet: surveySetID,
      survey: surveyID
    }, {
      respondent: true
    }),
    Survey.findOne({
      _id: surveyID
    }).populate('cohort').populate('surveySet').populate({
      path: 'cohort',
      populate: { path: 'owner' }
    })
  ]

  return Promise.all(promises).then(results => {
    const responses = results[0]
    const survey = results[1]
    const cohort = survey.cohort
    const surveySet = survey.surveySet

    const respondents = responses.map(response => response.respondent)
    const notYetResponded = cohort.members.filter(member => !respondents.includes(member))

    console.log('Re-sending emails to', notYetResponded)

    return sendSurveyResponseRequestEmailToEmails(cohort, surveySet, survey, notYetResponded)
  })
}

const sendUnsentSurveyResponseRequestEmails = function () {
  // Find all the survey requests that should have been sent that have not yet been sent
  return Survey.find({
    sendDate: {
      $lte: new Date()
    },
    sent: false
  }).populate('cohort').populate('surveySet').populate({
    path: 'cohort',
    populate: { path: 'owner' }
  }).then(function (surveysToSend) {
    console.log('Found %d surveys needing sending.', surveysToSend.length)

    // Calculate the number of emails to send
    const totalEmailsToSend = surveysToSend.reduce((accumulator, currentValue) => accumulator + currentValue.cohort.members.length, 0)
    console.log('We need to send %d total emails', totalEmailsToSend)

    let allSurveyEmailSendingPromises = []

    // Process each survey
    for (const thisSurvey of surveysToSend) {
      console.log('\tProcessing survey in surveySet %s', thisSurvey.surveySet.name)

      // Ensure the survey has cohort details
      if (!thisSurvey.cohort) {
        console.error('Survey with _id %s does not have cohort details', thisSurvey._id)
        continue
      }

      const thisSurveyEmailSendingPromises = sendSurveyResponseRequestEmailToCohort(thisSurvey.cohort, thisSurvey.surveySet, thisSurvey)

      // Save the "sent" state of this survey
      thisSurveyEmailSendingPromises.then(function () {
        return Survey.findByIdAndUpdate(thisSurvey._id, {
          sent: true
        })
      }).catch(err => {
        console.err(err)
        console.log(`Failed to set sent: true on survey with id ${thisSurvey._id}.`)
      })

      // Append the promises for sending the emails for this survey to all of the other promises
      allSurveyEmailSendingPromises = allSurveyEmailSendingPromises.concat(thisSurveyEmailSendingPromises)
    }
    return Promise.all(allSurveyEmailSendingPromises)
  }).then(results => {
    const emailsSent = results.reduce((sum, value) => sum + value.length, 0)
    console.log(`Successfully sent ${emailsSent} emails from ${results.length} surveys.`)
    return Promise.resolve({emailsSent, surveysSent: results})
  }).catch(function (err) {
    console.error('An error occured in the sendUnsentSurveyResponseRequestEmails function. Error:', err)
    return Promise.reject(err)
  })
}

module.exports = {
  sendUnsentSurveyResponseRequestEmails,
  resendSurveyResponseRequestEmails,
  sendSurveyResponseRequestEmailToCohort,
  sendSurveyResponseRequestEmailToEmails
}
