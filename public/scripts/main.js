require('./dashboard.js')
require('./editQuestions.js')
require('./survey.js')
require('./editCohort.js')
require('./editSurveySet.js')
require('./results.js')
require('./displayDate.js')

$(function () {
  // Prevent automatic submission of forms
  $('form').on('keyup keypress', function (e) {
    var keyCode = e.keyCode || e.which
    if (keyCode === 13) {
      e.preventDefault()
      return false
    }
  })
})
