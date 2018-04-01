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
        questionResponse.answer = $(question).find('input:checked').toArray().map(option => $(option).val()) || []
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

$(function () {
  console.log('Running')
  $('#survey').submit(function (event) {
    event.preventDefault()

    const form = $(this)

    // Prevent submitting preview forms
    if ($('[data-survey-preview]').length) {
      return $('#survey, .survey-completion-alert.alert-info').slideToggle()
    }

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
    const dataToSubmit = JSON.parse(JSON.stringify(data))
    console.log(dataToSubmit)

    $.post('/api/survey/submit', dataToSubmit).done(function () {
      console.log('done')
      $('#survey, .survey-completion-alert.alert-success').slideToggle()
    }).fail(function () {
      $('#survey, .survey-completion-alert.alert-danger').slideToggle()
    })
  })
})
