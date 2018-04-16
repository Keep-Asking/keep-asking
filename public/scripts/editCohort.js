const emailRE = /\S+@\S+\.\S+/

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

$(function () {
  $('#newCohortOwnerTrigger').click(addNewCohortOwner)
  $('[data-remove-coowner]').click(removeCoowner)
})
