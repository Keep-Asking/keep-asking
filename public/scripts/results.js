const displayDate = require('./displayDate.js')

const createChart = function (index, element) {
  const thisCanvas = element.getContext('2d')
  const data = $(element).data('responses')
  const maxDataPoint = data.reduce(function (a, b) {
    return Math.max(a, b)
  })
  const stepSize = Math.floor(maxDataPoint / 5)
  const thisChart = new Chart(thisCanvas, {
    type: 'bar',
    data: {
      labels: $(element).data('options'),
      datasets: [{
        label: 'Response Count',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255,99,132,1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      legend: {
        display: false
      },
      animation: {
        duration: 0
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true,
            stepSize: stepSize
          },
          scaleLabel: {
            display: true,
            labelString: 'Frequency of Selection'
          }
        }]
      },
      responsive: true,
      maintainAspectRatio: false
    }
  })

  // Save this chart to the element
  $(element).data('chart', thisChart)
}

const remindMembers = function () {
  const postData = {
    'surveyID': $(this).data('survey-id'),
    'cohortID': $(this).data('cohort-id'),
    'surveySetID': $(this).data('surveyset-id')
  }
  const button = $(this)
  $.post('/api/survey/resend', postData).done(function (data) {
    const thisAlert = $('.alert-reminder.alert-success')
    thisAlert.find('#emailSendCount').text(data.emailsSent)
    thisAlert.find('#emailSendCountPlural').toggle(data.emailsSent !== 0)
    const thisSurveyLabel = button.closest('table').find('thead th').eq(button.parent().index()).text().trim()
    thisAlert.find('#emailSendSurveyLabel').text(thisSurveyLabel)

    thisAlert.slideDown(200, function () {
      setTimeout(function () {
        thisAlert.slideUp()
      }, 10000)
    })
  }).fail(function () {
    $('.alert-reminder.alert-danger').slideDown(200, function () {
      setTimeout(function () {
        $(this).slideUp()
      }, 10000)
    })
  })
}

const displayDemographicQuestionOptions = function () {
  const options = $(this).find('option:selected').data('response-values') || []
  const questionType = $(this).find('option:selected').data('question-type')

  var elementHTML = ''
  if (questionType === 'scale') {
    elementHTML += '<div class="form-check form-check-inline">'
    let rand = Math.random()
    elementHTML += '<label style="padding-right:10px" class="form-check-label" for="' + rand + '">' + options[0] + '</label><div><input class="form-check-input" type="checkbox" name="filter-options" value="1" id="' + rand + '">'
    for (let index = 2; index <= 4; index++) {
      rand = Math.random()
      elementHTML += '<input class="form-check-input" type="checkbox" name="filter-options" value="' + index + '" id="' + rand + '">'
    }
    rand = Math.random()
    elementHTML += '<input sclass="form-check-input" type="checkbox" name="filter-options" value="5" id="' + rand + '"></div><label class="form-check-label" for="' + rand + '" style="padding-left:10px">' + options[1] + '</label>'
  } else {
    elementHTML = options.map((option, index, array) => {
      const rand = Math.random()
      return '<div class="form-check"><input class="form-check-input" type="checkbox" name="filter-options" value="' + option + '" id="' + rand + '"><label class="form-check-label" for="' + rand + '">' + option + '</label>' + '</div>'
    }).join('')
  }
  $('#demographicQuestionFilterOptions').html(elementHTML)
  fetchFilteredSurveyResults()
}

const fetchFilteredSurveyResults = function () {
  let query = [
    'cohortID=' + $('#surveyResults').data('cohort-id'),
    'surveySetID=' + $('#surveyResults').data('surveyset-id')
  ]
  const filterQuestionID = $('#demographicQuestionFilter option:selected').val()
  if (filterQuestionID.length !== 0) {
    query.push('filterQuestionID=' + filterQuestionID)
    const filterQuestionValues = $('[name="filter-options"]:checked').map(function (i, el) { return el.value }).get()
    query.push('filterQuestionValues=' + encodeURIComponent(JSON.stringify(filterQuestionValues)))
  }
  query = query.join('&')

  $.get('/api/surveysets/results?' + query).done(function (data) {
    $('#surveyResults').html(data)
    $('#surveyResults .scaleChoiceChart').each(createChart)

    // Update displayed dates
    displayDate()
  }).fail(function (err) {
    console.error(err)
  })
}

$(function () {
  $('.scaleChoiceChart').each(createChart)
  $('.resend-survey-email-trigger').click(remindMembers)
  $('#demographicQuestionFilter').change(displayDemographicQuestionOptions)
  $('#demographicQuestionFilterOptions').on('change', 'input', fetchFilteredSurveyResults)
})
