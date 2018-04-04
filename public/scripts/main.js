require('./dashboard.js')
require('./editQuestions.js')
require('./survey.js')

/*
const moment = require('moment')

// var ctx = document.getElementById('myChart').getContext('2d')

var timeFormat = 'MM/DD/YYYY HH:mm'

var Samples = {}
Samples.utils = {
  srand: function (seed) {
    this._seed = seed
  },

  rand: function (min, max) {
    var seed = this._seed
    min = min === undefined ? 0 : min
    max = max === undefined ? 1 : max
    this._seed = (seed * 9301 + 49297) % 233280
    return min + (this._seed / 233280) * (max - min)
  }
}

var randomScalingFactor = function () {
  return Math.round(Samples.utils.rand(-100, 100))
}

function newDate (days) {
  return moment().add(days, 'd').toDate()
}

var config = {
  type: 'line',
  data: {
    labels: [ // Date Objects
      newDate(0),
      newDate(1),
      newDate(2),
      newDate(3),
      newDate(4),
      newDate(5),
      newDate(6)
    ],
    datasets: [{
      label: 'My First dataset',
      backgroundColor: 'red',
      borderColor: 'orange',
      fill: false,
      data: [
        10,
        20,
        50,
        14,
        17,
        12,
        30
      ]
    }]
  },
  options: {
    title: {
      text: 'Chart.js Time Scale'
    },
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          parser: timeFormat,
          tooltipFormat: 'll HH:mm'
        },
        scaleLabel: {
          display: true,
          labelString: 'Date'
        },
        ticks: {
          source: 'data'
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'value'
        }
      }]
    }
  }
}

console.log(config);

window.onload = function () {
  var ctx = document.getElementById('myChart').getContext('2d')
  var myLine = new Chart(ctx, config)
}

// const x = new Chart(ctx, {
//   'type': 'line',
//   'data': {
//     // 'labels': ['1 Mar 2018', '2 Mar 2018', '5 Mar 2018', '6 Mar 2018'],
//     'datasets': [
//       {
//         'label': 'My First Dataset',
//         data: [{
//           t: '1 Mar 2018',
//           y: 1
//         }, {
//           t: '5 Mar 2018',
//           y: 10
//         }],
//         // 'data': [65, 59, 80, 81, 56, 55, 40],
//         'fill': false,
//         'borderColor': 'rgb(75, 192, 192)',
//         'lineTension': 0.1
//       }
//     ]},
//   'options': {
//     scales: {
//       yAxes: [{
//         type: 'linear'
//       }],
//       xAxis: [{
//         type: 'time',
//         time: {
//           unit: 'month',
//           parser: 'D MMM YYYY'
//         },
//         ticks: {
//           source: 'auto'
//         }
//       }]
//     }
//   }
// })
//
// const line = new Chart(ctx, {
//   type: 'line',
//   data: {
//     datasets: [
//       {
//         data: [{
//           x: new Date(),
//           y: 1
//         }, {
//           t: new Date(),
//           y: 10
//         }]
//       }
//     ]
//   },
//   options: {
//     scales: {
//       yAxes: [{
//         scaleLabel: {
//           display: true,
//           labelString: '% of Respondents'
//         }
//       }],
//       xAxes: [{
//         type: 'time',
//         scaleLabel: {
//           display: true,
//           labelString: 'Survey Date'
//         }
//       }]
//     }
//   }
// })

  // var stackedLine = new Chart(ctx, {
  //   type: 'line',
  //   data: {
  //     labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  //     datasets: [{
  //       label: 'Very Much',
  //       data: [12, 19, 3, 5, 2, 3],
  //       backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //       borderColor: 'rgba(255,99,132,1)',
  //       borderWidth: 1
  //     }, {
  //       label: 'Very Little',
  //       data: [15, 2, 5, 6, 1, 7],
  //       backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //       borderColor: 'blue',
  //       borderWidth: 1
  //     }]
  //   },
  //   options: {
  //     scales: {
  //       yAxes: [{
  //         stacked: true
  //       }]
  //     }
  //   }
  // })
  // const options = {
  //   scales: {
  //     xAxes: [{
  //       stacked: true
  //     }],
  //     yAxes: [{
  //       stacked: true
  //     }]
  //   }
  // }
  //
  // // "rgba(255, 99, 132, 0.2)","rgba(255, 159, 64, 0.2)","rgba(255, 205, 86, 0.2)","rgba(75, 192, 192, 0.2)","rgba(54, 162, 235, 0.2)","rgba(153, 102, 255, 0.2)","rgba(201, 203, 207, 0.2)"],"borderColor":["rgb(255, 99, 132)","rgb(255, 159, 64)","rgb(255, 205, 86)","rgb(75, 192, 192)","rgb(54, 162, 235)","rgb(153, 102, 255)","rgb(201, 203, 207)"
  //
  // var mixedChart = new Chart(ctx, {
  //   type: 'bar',
  //   data: {
  //     datasets: [{
  //       label: 'Average Response',
  //       data: [57.5, 27.5, 50],
  //       backgroundColor: 'rgba(255, 99, 132, 0.2)',
  //       borderColor: 'rgb(255, 99, 132)',
  //       fill: false,
  //       // Changes this dataset to become a line
  //       type: 'line'
  //     }, {
  //       label: 'Very Much',
  //       data: [50, 10, 40],
  //       backgroundColor: 'rgba(255, 159, 64, 0.2)',
  //       borderColor: 'rgba(255, 159, 64)',
  //       borderWidth: 5
  //     }, {
  //       label: '',
  //       data: [50, 10, 40],
  //       backgroundColor: 'rgba(255, 159, 64, 0.2)',
  //       borderColor: 'rgba(255, 159, 64)',
  //       borderWidth: 5
  //     }, {
  //       label: '',
  //       data: [50, 10, 40],
  //       backgroundColor: 'rgba(255, 159, 64, 0.2)',
  //       borderColor: 'rgba(255, 159, 64)',
  //       borderWidth: 5
  //     }, {
  //       label: '',
  //       data: [15, 35, 20],
  //       backgroundColor: 'rgba(255, 205, 86, 0.2)',
  //       borderColor: 'rgba(255, 205, 86)',
  //       borderWidth: 5
  //     }, {
  //       label: 'Very Little',
  //       data: [35, 55, 20],
  //       backgroundColor: 'rgba(0, 123, 255, 0.5)',
  //       borderColor: 'rgba(100, 123, 255)',
  //       borderWidth: 5
  //     }],
  //     labels: ['1 Mar 2018', '2 Mar 2018', '3 Mar 2018']
  //   },
  //   options: {
  //     scales: {
  //       xAxes: [{
  //         stacked: true,
  //         scaleLabel: {
  //           display: true,
  //           labelString: 'Survey Date'
  //         }
  //       }],
  //       yAxes: [{
  //         stacked: true,
  //         scaleLabel: {
  //           display: true,
  //           labelString: '% of Respondents'
  //         },
  //         ticks: {
  //           labels: ['Very Little', 'Very Much']
  //         }
  //       }]
  //     }
  //   }
  // })

  // var myChart = new Chart(ctx, {
  //   type: 'bar',
  //   data: {
  //     labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  //     datasets: [{
  //       label: '# of Votes',
  //       data: [12, 19, 3, 5, 2, 3],
  //       backgroundColor: [
  //         'rgba(255, 99, 132, 0.2)',
  //         'rgba(54, 162, 235, 0.2)',
  //         'rgba(255, 206, 86, 0.2)',
  //         'rgba(75, 192, 192, 0.2)',
  //         'rgba(153, 102, 255, 0.2)',
  //         'rgba(255, 159, 64, 0.2)'
  //       ],
  //       borderColor: [
  //         'rgba(255,99,132,1)',
  //         'rgba(54, 162, 235, 1)',
  //         'rgba(255, 206, 86, 1)',
  //         'rgba(75, 192, 192, 1)',
  //         'rgba(153, 102, 255, 1)',
  //         'rgba(255, 159, 64, 1)'
  //       ],
  //       borderWidth: 1
  //     }]
  //   },
  //   options: {
  //     scales: {
  //       yAxes: [{
  //         ticks: {
  //           beginAtZero: true
  //         }
  //       }]
  //     }
  //   }
  // })
*/
