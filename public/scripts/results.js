const createChart = function (index, element) {
  const thisCanvas = element.getContext('2d')
  const thisChart = new Chart(thisCanvas, {
    type: 'bar',
    data: {
      labels: $(element).data('options'),
      datasets: [{
        label: 'Response Count',
        data: $(element).data('responses'),
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
            stepSize: 1
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
  console.log(postData)
  $.post('/api/survey/resend', postData, function (data, status) {
    console.log(data, status)
  })
}

$(function () {
  $('.scaleChoiceChart').each(createChart)
  $('.resend-survey-email-trigger').click(remindMembers)
})
