const nodemailer = require('nodemailer')
const sparkPostTransport = require('nodemailer-sparkpost-transport')
const mailgunTransport = require('nodemailer-mailgun-transport')

require('dotenv').config()
const config = require('./config.js')

// Configure the third-party transport service
let transportPlugin
switch (config.transport) {
  case 'mailgun':
    console.log('You are using the MailGun transport.')
    transportPlugin = mailgunTransport({
      auth: {
        api_key: config.mailgun.apiKey,
        domain: config.mailgun.domain
      }
    })
    break
  case 'sparkpost':
    console.log('You are using the SparkPost transport.')
    transportPlugin = sparkPostTransport({
      options: {
        open_tracking: false,
        click_tracking: false,
        transactional: true
      }
    })
    break
  default:
    // Mock Transport (does not actually send messages)
    console.log('You are using a mock transport. Emails will not actually be sent.')
    transportPlugin = {
      jsonTransport: true
    }
}
const mailer = nodemailer.createTransport(transportPlugin)
const transport = config.transport || 'mock'

module.exports = {
  mailer: mailer,
  transport
}
