const uuid = require('uuid')
const moment = require('moment')

const initialiseEmailsTokenField = function () {
  $('#cohortMemberEmails').on('tokenfield:createtoken', function (e) {
    e.attrs.value = e.attrs.value.toLowerCase()
    e.attrs.label = e.attrs.label.toLowerCase()
  }).on('tokenfield:createdtoken', function (e) {
    // Über-simplistic e-mail validation
    var re = /\S+@\S+\.\S+/
    if (!re.test(e.attrs.value)) {
      $(e.relatedTarget).addClass('invalid')
    }
  }).tokenfield({
    delimiter: [',', ' ', '\n', '\t', ';'],
    createTokensOnBlur: true
  })
}

const serializeQuestions = function (form) {
  let serializedQuestions = []
  form.find('.form-question').not('#question-template .form-question').each(function (questionIndex, questionElement) {
    console.log(questionElement)
    let thisQuestion = {
      id: $(questionElement).find('[data-question-attribute="id"]').val().trim(),
      title: $(questionElement).find('[data-question-attribute="title"]').val().trim(),
      kind: $(questionElement).find('[data-question-attribute="kind"]').val().trim()
    }

    if (thisQuestion.id.length === 0) {
      thisQuestion.id = uuid.v4()
    }

    switch (thisQuestion.kind) {
      case 'text':
        thisQuestion.textAreaSize = $(questionElement).find('[data-question-attribute="textAreaSize"]:checked').val().trim()
        break
      case 'scale':
        thisQuestion.options = [
          $(questionElement).find('[data-question-attribute="options[0]"]').val().trim(),
          $(questionElement).find('[data-question-attribute="options[1]"]').val().trim()
        ]
        break
      case 'choice':
        thisQuestion.options = $(questionElement).find('[data-question-attribute="options"]').tokenfield('getTokens').map(val => val.value)
        thisQuestion.multipleChoice = $(questionElement).find('[data-question-attribute="multipleChoice"]:checked').val().trim() === 'multiple'
        break
    }

    serializedQuestions.push(thisQuestion)
  })
  return serializedQuestions
}

$(function () {
  initialiseEmailsTokenField()

  $('#editCohortForm').submit(function (event) {
    if (event) {
      event.preventDefault()
    }

    $('.is-invalid').removeClass('is-invalid')
    $('#cohortNameHelp, #cohortMemberEmailsHelp').addClass('text-muted').removeClass('text-danger')

    let cohortMemberEmails = $('#cohortMemberEmails').tokenfield('getTokens').map(function (val) {
      return val.value
    })

    let cohortData = {
      name: $('#cohortName').val(),
      members: cohortMemberEmails,
      demographicQuestions: serializeQuestions($(this))
    }

    if ($(this).data('cohort-id')) {
      cohortData.id = $(this).data('cohort-id')
    }

    $.post('/api/cohorts/update', cohortData).done(function () {
      window.location.href = '/'
    }).fail(function (err) {
      if (err && err.status === 400) {
        if (err.responseJSON) {
          console.log('switching')
          switch (err.responseJSON.invalidField) {
            case 'name':
              $('#cohortName').addClass('is-invalid')
              $('#cohortNameHelp').removeClass('text-muted').addClass('text-danger')
              break
            case 'members':
              $('#cohortMemberEmails').addClass('is-invalid')
              $('#cohortMemberEmailsHelp').removeClass('text-muted').addClass('text-danger')
              break
            default:
              window.alert('Sadface')
          }
        }
      }
      console.log(err)
    })
  })

  // Insert cohort ID into new survey set modal
  $('#newSurveyModal').on('show.bs.modal', function (event) {
    const cohortID = $(event.relatedTarget).data('cohort-id') // Extract info from data-* attributes
    $('#cohort-id').val(cohortID)
  })

  $('#surveyScheduleDatepicker').datepicker()

  const timeFormats = ['HH:mm', 'hh:mm a']
  // Parse text time to sendTimeMilliseconds
  $('#surveySendTime').on('blur', function () {
    const timeString = $(this).val()
    let timeMoment = moment(timeString, timeFormats)
    if (!timeMoment.isValid()) {
      return $('#surveySendTime').val('')
    }
    const timeDisplay = timeMoment.format(timeFormats[0])
    const sendTimeMilliseconds = timeMoment.diff(moment().startOf('day'))
    $(this).val(timeDisplay).data('sendTimeMilliseconds', sendTimeMilliseconds)
  })

  $('#editSurveyForm').submit(function (event) {
    event.preventDefault()
    $('#surveySendTime').blur()

    const selectedDates = $('#surveyScheduleDatepicker').datepicker('getDates')
    const sendTimeMilliseconds = $('#surveySendTime').data('sendTimeMilliseconds')

    let sendDates = selectedDates.map(function (selectedDate) {
      return moment(selectedDate).startOf('day').add(sendTimeMilliseconds, 'ms').toDate()
    }).map(function (date) {
      return date.toJSON()
    })

    // Construct data obejct to send to server
    let surveySetData = {
      name: $('#surveyName').val().trim(),
      sendDates: sendDates,
      questions: serializeQuestions($(this))
    }

    // Add cohort and survey ID to surveySetData
    const cohortID = $('#cohort-id').val().trim()
    if (cohortID.length > 0) {
      surveySetData.cohort = cohortID
    }
    const surveyID = $('#survey-id').val().trim()
    if (surveyID.length > 0) {
      surveySetData.survey = surveyID
    }

    $.post('/api/surveysets/update', surveySetData).done(function () {
      window.location.href = '/'
    }).fail(function (err) {
      if (err && err.status === 400) {
        if (err.responseJSON) {
          console.log('switching')
          switch (err.responseJSON.invalidField) {
            case 'name':
              $('#cohortName').addClass('is-invalid')
              $('#cohortNameHelp').removeClass('text-muted').addClass('text-danger')
              break
            case 'members':
              $('#cohortMemberEmails').addClass('is-invalid')
              $('#cohortMemberEmailsHelp').removeClass('text-muted').addClass('text-danger')
              break
            default:
              window.alert('Sadface')
          }
        }
      }
      console.log(err)
    })
  })

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
