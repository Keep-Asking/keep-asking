const moment = require('moment')

const displayDate = function () {
  $('[data-display-date]').each((index, element) => {
    const date = $(element).data('display-date')
    const format = $(element).data('display-date-format') || 'D MMM Y'
    $(element).text(moment(date).format(format))
  })
}

$(function () {
  displayDate()
})
