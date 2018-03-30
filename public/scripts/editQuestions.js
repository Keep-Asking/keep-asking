const initialiseOptionsTokenField = function () {
  $('.tokenfield.options').tokenfield({
    createTokensOnBlur: true
  })
}

const questionTemplatesHTML = {
  basic: $('#question-template div[data-question-type="basic"]').html(),
  text: $('#question-template div[data-question-type="text"]').html(),
  scale: $('#question-template div[data-question-type="scale"]').html(),
  choice: $('#question-template div[data-question-type="choice"]').html()
}

$(function () {
  initialiseOptionsTokenField()

  // Add a new question
  $('[data-action="add-question"]').click(function addNewQuestion () {
    let questionToInsert = $(questionTemplatesHTML.basic)
    questionToInsert.find('.question-type-content').html(questionTemplatesHTML.text)
    const rand = Math.random()
    questionToInsert.find('.form-check-input').attr('name', rand).each(function (i, element) {
      const rand = Math.random()
      $(element).attr('id', rand)
      $(element).next().attr('for', rand)
    })
    questionToInsert.insertBefore($('.add-question-button-row'))
    questionToInsert.find('[data-question-attribute="title"]').focus()
    initialiseOptionsTokenField()
  })

  $('form').on('change', 'select[data-question-attribute="kind"]', function updateQuestionType () {
    $(this).closest('.form-question').find('.question-type-content').html(questionTemplatesHTML[this.value])
    initialiseOptionsTokenField()
  })
})
