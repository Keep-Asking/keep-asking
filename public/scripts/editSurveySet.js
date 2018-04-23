const moment = require('moment')
const serializeQuestions = require('./editQuestions.js').serializeQuestions

const getSurveys = function () {
  return $('.survey-name-item').map(function (index, element) {
    return {
      date: new Date($(element).data('date')),
      name: $(element).val().trim()
    }
  }).get()
}

const updateSurveyNameFields = function (event) {
  const calendarSurveyDates = event.dates
  const oldSurveys = getSurveys()

  // Generate the objects representing the surveys
  const newSurveys = calendarSurveyDates.map(date => {
    const displayDate = moment(date).format('D MMM Y')
    const survey = {
      date: date,
      displayDate: displayDate,
      name: displayDate
    }
    const thisNamedSurvey = oldSurveys.find(survey => date.getTime() === survey.date.getTime())
    if (thisNamedSurvey && thisNamedSurvey.name) {
      survey.name = thisNamedSurvey.name
    }
    return survey
  }).sort((a, b) => a.date - b.date)

  // Generate HTML for each survey
  const newSurveysHTML = newSurveys.map(survey => `<tr>
    <td><label class="text-nowrap mr-2 mt-1">${survey.displayDate}:</label></td>
    <td>
      <input type="text" class="form-control form-control-sm survey-name-item" aria-describedby="surveyNamesHelp" value="${survey.name}" placeholder="${survey.displayDate}" data-date="${survey.date.getTime()}">
    </td>
  </tr>`)

  // Update the view with the new items
  $('#surveyNames').empty().append(newSurveysHTML)
}

const submitEditSurveySetForm = function (event) {
  $('#surveySendTime').blur()

  const sendTimeMilliseconds = $('#surveySendTime').data('sendTimeMilliseconds')

  // Normalise survey send dates with specific send time
  const surveys = getSurveys().map(survey => {
    survey.date = moment(survey.date).startOf('day').add(sendTimeMilliseconds, 'ms').toDate()
    return survey
  })

  const responseAcceptancePeriodString = $('#surveyResponseAcceptancePeriod').val()
  const responseAcceptancePeriod = Number.parseFloat(responseAcceptancePeriodString)
  if (Number.isNaN(responseAcceptancePeriod)) {
    return window.alert('The response acceptance period must be a number. "' + responseAcceptancePeriodString + '" cannot be interpreted as a number.')
  }

  // Construct data obejct to send to server
  const surveySetData = {
    name: $('#surveyName').val().trim(),
    surveys: surveys,
    responseAcceptancePeriod: responseAcceptancePeriod,
    questions: serializeQuestions($(this))
  }

  // Add cohort and survey ID to surveySetData
  const cohortID = $('#cohort-id').val().trim()
  if (cohortID.length === 0) {
    return window.alert('No Cohort ID could be found. Cannot save survey.')
  }
  let url = '/api/cohorts/' + cohortID + '/surveySets'
  let method = 'POST'
  const surveySetID = $('#survey-id').val().trim()
  if (surveySetID.length > 0) {
    url += '/' + surveySetID
    method = 'PATCH'
  }

  console.log({
    url: url,
    method: method,
    data: surveySetData
  })

  $.ajax({
    url: url,
    method: method,
    data: surveySetData
  }).done(function () {
    window.location.href = '/'
  }).fail(function (err, status, errThrown) {
    console.error(err, status, errThrown)
    return window.alert('A server error occured and your survey may not have been saved.')
  })
}

// Parse text time to sendTimeMilliseconds
const timeFormats = ['HH:mm', 'hh:mm a']
const parseSurveySendTime = function () {
  const timeString = $(this).val()
  let timeMoment = moment(timeString, timeFormats)
  if (!timeMoment.isValid()) {
    return $('#surveySendTime').val('')
  }
  const timeDisplay = timeMoment.format(timeFormats[0])
  const sendTimeMilliseconds = timeMoment.diff(moment().startOf('day'))
  $(this).val(timeDisplay).data('sendTimeMilliseconds', sendTimeMilliseconds)
}

$(function () {
  $('#editSurveyForm').submit(submitEditSurveySetForm)
  $('#surveyScheduleDatepicker').datepicker().on('changeDate', updateSurveyNameFields)
  $('#surveySendTime').on('blur', parseSurveySendTime)

  // parse saved date stamps from server into calendar view
  let surveyScheduleDatesString = $('#surveyScheduleDatepicker').data('date')
  if (surveyScheduleDatesString) {
    let surveyScheduleDates = surveyScheduleDatesString.split(',').map(function (date) {
      return new Date(date)
    })
    $('#surveyScheduleDatepicker').datepicker('setDates', surveyScheduleDates)
    if (surveyScheduleDates.length > 0) {
      let surveySendTime = moment(surveyScheduleDates[0]).format(timeFormats[0])
      $('#surveySendTime').val(surveySendTime).blur()
    }
  }
})
