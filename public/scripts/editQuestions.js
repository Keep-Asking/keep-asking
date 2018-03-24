$(function () {
  const initialiseOptionsTokenField = function () {
    $('.tokenfield.options').tokenfield({
      createTokensOnBlur: true
    })
  }
  initialiseOptionsTokenField()

  const questionTemplatesHTML = {
    basic: $('#question-template div[data-question-type="basic"]').html(),
    text: $('#question-template div[data-question-type="text"]').html(),
    scale: $('#question-template div[data-question-type="scale"]').html(),
    choice: $('#question-template div[data-question-type="choice"]').html()
  }

  // Add a new question
  $('[data-action="add-question"]').click(function () {
    let questionToInsert = $(questionTemplatesHTML.basic)
    questionToInsert.find('.question-type-content').html(questionTemplatesHTML.text)
    questionToInsert.insertBefore($('.add-question-button-row'))
    questionToInsert.find('[data-question-attribute="title"]').focus()
  })

  $('form').on('change', 'select[data-question-attribute="kind"]', function () {
    $(this).closest('.form-question').find('.question-type-content').html(questionTemplatesHTML[this.value])
  })
})
