// $(function () {
//   $('.tokenfield').on('tokenfield:createtoken', function (e) {
//     e.attrs.value = e.attrs.value.toLowerCase()
//     e.attrs.label = e.attrs.label.toLowerCase()
//   }).on('tokenfield:createdtoken', function (e) {
//     // Über-simplistic e-mail validation
//     var re = /\S+@\S+\.\S+/
//     if (!re.test(e.attrs.value)) {
//       $(e.relatedTarget).addClass('invalid')
//     }
//   }).tokenfield({
//     delimiter: [',', ' ', '\n', '\t', ';'],
//     createTokensOnBlur: true
//   })
//
//   $('#editCohortForm').submit(function (event) {
//     event.preventDefault()
//
//     $('.is-invalid').removeClass('is-invalid')
//
//     let cohortMemberEmails = $('#cohortMemberEmails').tokenfield('getTokens').map(function (val) {
//       return val.value
//     })
//
//     $.post('/api/cohorts/update', {
//       name: $('#cohortName').val(),
//       members: cohortMemberEmails
//     }).done(function () {
//       window.location.href = '/'
//     }).fail(function (err) {
//       console.log('bad req!')
//       if (err && err.status === 400) {
//         if (err.responseJSON) {
//           console.log('switching')
//           switch (err.responseJSON.invalidField) {
//             case 'name':
//               $('#cohortName').addClass('is-invalid')
//               break
//             case 'members':
//               $('#cohortMemberEmails').addClass('is-invalid')
//               break
//             default:
//               window.alert('Sadface')
//           }
//         }
//       }
//       console.log(err)
//     })
//   })
//
//   $('a.delete-cohort').click(function () {
//
//   })
// })
