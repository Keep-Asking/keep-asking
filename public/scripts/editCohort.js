const serializeQuestions = require('./editQuestions.js').serializeQuestions

const emailRE = /\S+@\S+\.\S+/

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

const addNewCohortOwner = function () {
  const newCohortOwnerEmail = $('#newCohortOwner').val().trim()

  // Perform basic email validation
  if (!emailRE.test(newCohortOwnerEmail)) {
    return window.alert('The new cohort owner must be a valid email address.')
  }

  const cohortID = $('[data-cohort-id]').data('cohort-id')

  $.ajax({
    url: '/api/cohorts/' + cohortID + '/owners/' + encodeURIComponent(newCohortOwnerEmail),
    type: 'PUT'
  }).done(function (data) {
    $('#newCohortOwnerTrigger').closest('.list-group-item').before('<li class="list-group-item">' + newCohortOwnerEmail + ' <i class="text-muted">(Invitation Pending)</i></li>')
    $('#newCohortOwner').val('')
  }).fail(function (err) {
    console.error(err)
  })
}

const removeCoowner = function () {
  const coOwnerToRemove = $(this).data('remove-coowner')
  const eventTarget = $(this)

  const cohortID = $('[data-cohort-id]').data('cohort-id')

  $.ajax({
    url: '/api/cohorts/' + cohortID + '/owners/' + encodeURIComponent(coOwnerToRemove),
    type: 'DELETE'
  }).done(function (data) {
    eventTarget.closest('.list-group-item').remove()
  }).fail(function (err) {
    console.error(err)
  })
}

const submitEditCohortForm = function (event) {
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

  // Determine request parameters
  var method = 'POST'
  var url = '/api/cohorts'

  // Update an existing cohort
  if ($(this).data('cohort-id')) {
    cohortData.id = $(this).data('cohort-id')
    method = 'PATCH'
    url = '/api/cohorts/' + cohortData.id
  }

  $.ajax({
    method: method,
    url: url,
    data: cohortData
  }).done(function () {
    window.location.href = '/'
  }).fail(function (err) {
    window.alert('An error occured and the cohort may not have been created.')
    console.error(err)
  })
}

$(function () {
  initialiseEmailsTokenField()
  $('#editCohortForm').submit(submitEditCohortForm)
  $('#newCohortOwnerTrigger').click(addNewCohortOwner)
  $('[data-remove-coowner]').click(removeCoowner)
})
