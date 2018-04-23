const uuid = require('uuid')

const initialiseOptionsTokenField = function () {
  $('.tokenfield.options').tokenfield({
    createTokensOnBlur: true
  })
}

const questionTemplatesHTML = {
  basic: $('#question-template div[data-question-type="basic"]').html(),
  text: $('#question-template div[data-question-type="text"]').html(),
  scale: $('#question-template div[data-question-type="scale"]').html(),
  choice: $('#question-template div[data-question-type="choice"]').html(),
  rank: $('#question-template div[data-question-type="rank"]').html()
}

const populateConfirmDeleteQuestion = function (event) {
  const button = $(event.relatedTarget) // Button that triggered the modal
  const question = button.closest('.form-question')
  const questionID = question.find('[data-question-attribute="id"]').val()
  let questionTitle = question.find('[data-question-attribute="title"]').val()
  const modal = $(this)

  if (questionTitle.length === 0) {
    questionTitle = 'Unnamed question'
  }
  modal.find('#deleteQuestionModalQuestionTitle').text(questionTitle)
  modal.find('#confirmDeleteQuestion').data('question-id', questionID)
}

const deleteQuestion = function () {
  const deleteQuestionID = $(this).data('question-id')
  $('[data-question-attribute="id"][value="' + deleteQuestionID + '"]').closest('.form-question').slideUp(function () {
    $(this).remove()
    $('#deleteQuestionModal').modal('hide')
  })
}

const addNewQuestion = function () {
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
}

const updateQuestionType = function () {
  $(this).closest('.form-question').find('.question-type-content').html(questionTemplatesHTML[this.value])
  initialiseOptionsTokenField()
}

function moveUp (element) {
  if (element.previousElementSibling) {
    element.parentNode.insertBefore(element, element.previousElementSibling)
  }
}
function moveDown (element) {
  if (element.nextElementSibling) {
    element.parentNode.insertBefore(element.nextElementSibling, element)
  }
}
document.querySelector('ul').addEventListener('click', function (e) {
  if (e.target.className === 'down') moveDown(e.target.parentNode)
  else if (e.target.className === 'up') moveUp(e.target.parentNode)
})

const moveQuestion = function (event) {
  const thisQuestion = $(this).closest('.form-question')
  switch ($(this).data('move-direction')) {
    case 'up':
      if (thisQuestion.prev('.form-question')) {
        thisQuestion.insertBefore(thisQuestion.prev('.form-question'))
      }
      break
    case 'down':
      if (thisQuestion.next('.form-question')) {
        thisQuestion.insertAfter(thisQuestion.next('.form-question'))
      }
      break
  }
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
      case 'rank':
        thisQuestion.options = $(questionElement).find('[data-question-attribute="options"]').tokenfield('getTokens').map(val => val.value)
        break
    }

    serializedQuestions.push(thisQuestion)
  })
  return serializedQuestions
}

$(function () {
  initialiseOptionsTokenField()

  // Add a new question
  $('[data-action="add-question"]').click(addNewQuestion)

  // Manage changing the question type
  $('form').on('change', 'select[data-question-attribute="kind"]', updateQuestionType)

  $('form').on('click', '.form-question .btn-move-question', moveQuestion)

  // Bind event for confirming deleting of questions
  $('#deleteQuestionModal').on('show.bs.modal', populateConfirmDeleteQuestion)

  $('#confirmDeleteQuestion').on('click', deleteQuestion)
})

module.exports = {
  serializeQuestions
}
