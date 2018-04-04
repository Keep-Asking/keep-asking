require('./dashboard.js')
require('./editQuestions.js')
require('./survey.js')

$(function () {
  $('.scaleChoiceChart').each((index, element) => {
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
            }
          }]
        },
        responsive: true,
        maintainAspectRatio: false
      }
    })
  })
})
