$(function () {
  $('.tokenfield').on('tokenfield:createtoken', function (e) {
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

  $('#newCohortForm').submit(function (event) {
    event.preventDefault()

    $('.is-invalid').removeClass('is-invalid')
    $('#cohortNameHelp, #cohortMemberEmailsHelp').addClass('text-muted').removeClass('text-danger')

    let cohortMemberEmails = $('#cohortMemberEmails').tokenfield('getTokens').map(function (val) {
      return val.value
    })

    let cohortData = {
      name: $('#cohortName').val(),
      members: cohortMemberEmails
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

  let generateDates = function () {
    console.log('generateDates triggered')
    $('#surveySendingTimes li').remove()

    let scheduleString = $('#surveySchedule').val().trim()
    let schedule = later.parse.text(scheduleString)
    console.log(schedule)
    if (schedule.error === -1) {
      $('#surveySchedule').removeClass('is-invalid')
    } else {
      $('#surveySchedule').addClass('is-invalid')
      // console.error('An error occured at position', schedule.error, scheduleString)
      return
    }

    console.log(schedule)

    let startDate = $('#datepicker [name="start"]').datepicker('getDate')
    let endDate = $('#datepicker [name="end"]').datepicker('getDate')
    let surveyDates = later.schedule(schedule).next(10, startDate, endDate)
    console.log(surveyDates)

    for (let surveyDatesIndex in surveyDates) {
      $('#surveySendingTimes').append('<li>' + surveyDates[surveyDatesIndex] + '</li>')
    }
    // let surveyDates = later.schedule(schedule).next(10, startDate, endDate)
    // console.log(surveyDates)
  }

  // Insert cohort ID into new survey set modal
  $('#newSurveyModal').on('show.bs.modal', function (event) {
    const cohortID = $(event.relatedTarget).data('cohort-id') // Extract info from data-* attributes
    console.log(cohortID)
    $('#cohort-id').val(cohortID)
  })

  later.date.localTime()
  $('#surveySchedule').on('input', generateDates)
  $('#datepicker input').datepicker().on('changeDate', generateDates)
  $('#surveyScheduleDatepicker').datepicker()

  // Parse text time to timeMilliseconds
  $('#surveySendTime').on('blur', function () {
    const timeString = $(this).val()
    let timeMoment = moment(timeString, ['HH:mm', 'hh:mm a'])
    if (!timeMoment.isValid()) {
      return $('#surveySendTime').val('')
    }
    const timeDisplay = timeMoment.format('HH:mm')
    const timeMilliseconds = timeMoment.diff(moment().startOf('day'))
    $(this).val(timeDisplay).data('timeMilliseconds', timeMilliseconds)
  })

  $('#newSurveyForm').submit(function (event) {
    event.preventDefault()

    // $('.is-invalid').removeClass('is-invalid')
    // $('#cohortNameHelp').addClass('text-muted').removeClass('text-danger')
    // $('#cohortMemberEmailsHelp').addClass('text-muted').removeClass('text-danger')

    // let cohortMemberEmails = $('#cohortMemberEmails').tokenfield('getTokens').map(function (val) {
    //   return val.value
    // })

    let selectedDates = $('#surveyScheduleDatepicker').datepicker('getDates')
    let timeMilliseconds = $('#surveySendTime').data('timeMilliseconds')

    let sendDates = selectedDates.map(function (selectedDate) {
      return moment(selectedDate).add(timeMilliseconds).toDate()
    })

    const cohortID = $('#cohort-id').val().trim()
    let surveySetData = {
      cohort: cohortID,
      name: $('#surveyName').val().trim(),
      surveyURL: $('#surveyURL').val().trim(),
      sendDates: sendDates
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

  // $('#datepicker').datepicker({
  //   todayHighlight: true
  // })
})

// m('3:15pm', ['HH:mm', 'hh:mm a']).diff(m().startOf('day')) / 3600000
