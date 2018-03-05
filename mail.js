let nodemailer = require('nodemailer')
let sparkPostTransport = require('nodemailer-sparkpost-transport')

let sparkPostOptions = {
  sparkPostApiKey: '2d9b034e64b822d1a6845030b37817bb9dfb06ef'
}
let transport = nodemailer.createTransport(sparkPostTransport(sparkPostOptions))

transport.sendMail({
  from: {
    name: 'Fast Feedback',
    email: 'survey@ffmail.sebthedev.com'
  },
  to: 's@sebthedev.com',
  subject: 'Testing Nodemailer with Sparkpost',
  text: 'Hello, this is a plain-text message.',
  html: 'Hello, this is an HTML message!'
}, function (err, info) {
  if (err) {
    console.log('Error!')
    console.log(err)
  } else {
    console.log('Success!')
    console.log(info)
  }
})
