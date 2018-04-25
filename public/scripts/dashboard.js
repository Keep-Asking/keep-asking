const toggleCohortArchivedStatus = function () {
  $.ajax({
    url: '/api/cohorts/' + $(this).data('cohort-id'),
    method: 'PATCH',
    data: {
      archived: !$(this).data('cohort-archived')
    }
  }).done(() => {
    window.location.reload()
  }).fail(err => {
    console.error(err)
  })
}

$(function () {
  $('.archive-toggle').click(toggleCohortArchivedStatus)

  // Insert cohort ID into new survey set modal
  $('#newSurveyModal').on('show.bs.modal', function (event) {
    const cohortID = $(event.relatedTarget).data('cohort-id') // Extract info from data-* attributes
    $('#cohort-id').val(cohortID)
  })

})
