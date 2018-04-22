const moment = require('moment')

const displayDate = function () {
  $('[data-display-date]').each((index, element) => {
    const date = $(element).data('display-date')
    const format = $(element).data('display-date-format') || 'D MMM Y'
    $(element).text(moment(date).format(format))

    const tooltipFormat = $(element).data('display-date-format-tooltip')
    if (tooltipFormat) {
      $(element).attr('title', moment(date).format(tooltipFormat)).tooltip()
    }
  })
}

$(function () {
  displayDate()
})
