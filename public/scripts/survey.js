const serializeResponse = function (form) {
  const demographicQuestionResponses = []
  const surveyQuestionResponses = []

  form.find('.form-question').each((i, question) => {
    const questionResponse = {
      id: $(question).data('question-id').trim()
    }

    switch ($(question).data('question-type').trim()) {
      case 'text':
        questionResponse.answer = $(question).find('[data-question-attribute="answer"]').val().trim()
        break
      case 'scale':
        questionResponse.answer = parseInt($(question).find('input:checked').val())
        break
      case 'choice':
        questionResponse.answer = $(question).find('input:checked').map((i, e) => $(e).val()).get() || []
        break
      case 'rank':
        questionResponse.answer = $(question).find('.list-group-sortable li').map((i, e) => $(e).text()).get()
        break
    }

    if (typeof $(question).data('question-demographic') === 'string') {
      demographicQuestionResponses.push(questionResponse)
    } else {
      surveyQuestionResponses.push(questionResponse)
    }
  })

  return {demographicQuestionResponses, surveyQuestionResponses}
}

// Initialise all sortables
sortable('.list-group-sortable', {
  placeholder: '<li class="list-group-item">&nbsp;</li>'
})

$(function () {
  $('#survey').submit(function (event) {
    event.preventDefault()

    const form = $(this)

    const questionAnswers = serializeResponse(form)

    const data = {
      cohortID: form.data('cohort-id'),
      surveySetID: form.data('surveyset-id'),
      surveyID: form.data('survey-id'),
      respondentEmail: form.data('respondent-email'),
      responseHash: form.data('response-hash'),
      demographicQuestionResponses: questionAnswers.demographicQuestionResponses,
      surveyQuestionResponses: questionAnswers.surveyQuestionResponses
    }

    // Prevent submitting preview forms
    if ($('[data-survey-preview]').length) {
      return $('#survey, .survey-completion-alert.alert-info').slideToggle()
    }

    $.post('/api/survey/submit', data).done(function () {
      console.log('done')
      $('#survey, .survey-completion-alert.alert-success').slideToggle()
    }).fail(function () {
      $('#survey, .survey-completion-alert.alert-danger').slideToggle()
    })
  })
})
