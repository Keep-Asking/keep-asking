const nodemailer = require('nodemailer')
const sparkPostTransport = require('nodemailer-sparkpost-transport')
const fs = require('fs')
const heml = require('heml')
const ejs = require('ejs')

require('dotenv').config()
const config = require('./config.js')
require('./database.js')
const generateSurveyAccessHash = require('./hash.js').generateSurveyAccessHash

const Survey = require('./../models/survey.js')
const emailTemplateSimplePlaintext = fs.readFileSync('./emails/surveyRequestSimplePlaintext.ejs', 'utf-8')
const emailTemplateSimpleHTML = fs.readFileSync('./emails/surveyRequestSimple.ejs', 'utf-8')

const sentSurveys = new Set()

// Determine whether this is a dry run (skip sending emails)
const dryRun = (process.argv[2] === '--dry-run')
if (dryRun) {
  console.log('Running a dry-run. No emails will actually be sent.')
}

const mailer = nodemailer.createTransport(sparkPostTransport({
  options: {
    open_tracking: false,
    click_tracking: false,
    transactional: true
  }
}))

// Workaround for HEML bug (see https://github.com/SparkPost/heml/issues/44)
let HEMLrunning = false
const renderHEML = function (emailHEML) {
  return new Promise((resolve, reject) => {
    return setTimeout(function () {
      if (!HEMLrunning) {
        HEMLrunning = true
        const emailHTML = heml(emailHEML)
        HEMLrunning = false
        return resolve(emailHTML)
      } else {
        return setTimeout(function () {
          return resolve(renderHEML(emailHEML))
        }, Math.random() * 1000)
      }
    }, Math.random() * 200)
  })
}

Survey.find({ // Find all the survey requests that should have been sent that have not yet been sent
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
  for (let surveyIndex in surveysToSend) {
    let thisSurvey = surveysToSend[surveyIndex]
    console.log('\tProcessing survey in surveySet %s', thisSurvey.surveySet.name)

    // Ensure the survey has cohort details
    if (!thisSurvey.cohort) {
      console.error('Survey with _id %s does not have cohort details', thisSurvey._id)
      continue
    }

    const thisSurveyEmailSendingPromises = thisSurvey.cohort.members.map(member => {
      const emailTopic = thisSurvey.surveySet.name.split(' ').filter(word => (!['survey', 'feedback'].includes(word.toLowerCase()))).join(' ')
      // Prepare the email data
      const emailData = {
        survey: thisSurvey,
        owner: thisSurvey.cohort.owner,
        member: member,
        host: config.host,
        surveyURL: [config.host, 'cohorts', thisSurvey.cohort._id, 'surveys', thisSurvey.surveySet._id, 'respond', thisSurvey._id].join('/') + `?email=${encodeURIComponent(member)}&hash=${generateSurveyAccessHash(thisSurvey.cohort._id, thisSurvey.surveySet._id, thisSurvey._id, member)}`,
        emailTopic: emailTopic
      }

      // Render the HTML email
      const emailHTML = ejs.render(emailTemplateSimpleHTML, emailData)

      // Render the plaintext email
      const emailPlaintext = ejs.render(emailTemplateSimplePlaintext, emailData)

      const ownerFullName = [thisSurvey.cohort.owner.name.givenName, thisSurvey.cohort.owner.name.familyName].join(' ')
      const emailConfiguration = {
        from: {
          name: ownerFullName,
          address: ownerFullName.split(' ').join('.').toLowerCase() + '@' + config.OUTBOUND_EMAIL_DOMAIN
        },
        replyTo: {
          name: ownerFullName,
          address: thisSurvey.cohort.owner.email
        },
        to: member,
        subject: [thisSurvey.cohort.name, emailTopic, 'Feedback'].join(' '),
        text: emailPlaintext,
        html: emailHTML
      }

      if (dryRun) {
        console.log(emailConfiguration)
        return member
      }

      return mailer.sendMail(emailConfiguration).then(info => {
        sentSurveys.add(thisSurvey._id)
        return member
      })
    })

    // Append the promises for sending the emails for this survey to all of the other promises
    allSurveyEmailSendingPromises = allSurveyEmailSendingPromises.concat(thisSurveyEmailSendingPromises)
  }
  return Promise.all(allSurveyEmailSendingPromises)
}).then(results => {
  console.log(`Successfully sent emails to ${results.length} recipients.`)
  if (sentSurveys.size === 0) {
    return
  }
  console.log('Recipients:', results.join(', '))
  console.log('Saving sent survey details to database')
  return Survey.updateMany(
    {
      _id: {
        $in: Array.from(sentSurveys)
      }
    },
    {
      sent: true
    })
}).then(() => {
  console.log('Done. Quitting.')
  process.exit(0)
}).catch(function (err) {
  console.error('Fatal error caught:', err)
  process.exit(1)
})
