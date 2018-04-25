# Keep Asking API
The Keep Asking RESTful API allows for programmatic access to the Keep Asking system over the Internet.

## API Root
The root address of the API is `/api`. For the main Keep Asking server, this means that API requests should be to resources starting with `https://www.keepasking.io/api/`.

## API Authentication
All requests require authentication using an API key. A user of Keep Asking can find their API key on their [profile](https://www.keepasking.io/profile) page. The API key can either be transmitted as the `apikey` URL parameter or as URL-encoded data in the body of the message with the key `apikey`.

## Examples
In this example we seek to get a listing of the members of the cohort with the cohort ID `abc123` using the API key `def456`:
```bash
curl -X GET https://www.keepasking.io/api/cohorts/abc123?apikey=def456
```

In this example we seek to rename the survey with ID `ghi789`:

```bash
curl -X PATCH https://www.keepasking.io/api/cohorts/abc123/surveySets/ghi789 --data 'apikey=def456' --data-urlencode 'name=My Amazing Survey'
```

In this example we seek to create a new survey set using the [jQuery.ajax()](https://api.jquery.com/jquery.ajax/) method, as one might do in a web browser. (Note that this request would likely be blocked by the browser due to [cross-site scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) concerns.)
```javascript
$.ajax({
  url: 'https://www.keepasking.io/api/cohorts/abc123/surveySets',
  method: 'POST',
  data: {
    apikey: 'def456',
    name: 'Science Course Survey',
    responseAcceptancePeriod: 4,
    surveys: [{
      name: 'Homework 1',
      date: '2018-04-25T20:00:00+00:00'
    }, {
      name: 'Homework 2',
      date: '2018-05-10T20:00:00+00:00'
    }],
    questions: [{
      title: 'How happy are you?',
      id: 'abcdefg1234567', // A unique identifier of your choosing
      kind: 'scale',
      options: ['Very Happy', 'Very Sad']
    }, {
      title: 'What did you eat most recently',
      id: 'ldignei32953',
      kind: 'text',
      textAreaSize: 'large'
    }, {
      title: 'Sort these according to your preference',
      id: 'woeirtuy32345',
      kind: 'rank',
      options: ['Apple', 'Orange', 'Banana']
    }]
  }
}).done(() => {
  // Take some action once the survey set has been created
}).fail((xhr, err1, err2) => {
  // Take some action if the survey set creation fails
})
```

## API Endpoints

### POST /cohorts
Create a new cohort. Body:
* `name`: String
* `members` (optional): Array of strings of email addresses of the members of the cohort
* `demographicQuestions` (optional): Array of questions

### GET /cohorts
Get a listing of the existing cohorts for the authenticated user. Returns a JSON array of objects. Each object represents a cohort and contains the cohort name and id.

### GET /cohorts/:cohortID
Get an existing cohort.

### PATCH /cohorts/:cohortID
Modify an existing cohort. Send one or more of the following:
* `name`: String
* `members` (optional): Array of strings of email addresses of the members of the cohort
* `demographicQuestions` (optional): Array of questions
Returns status code 200 on success.
* `archive` (optional): Boolean indicating whether this cohort should be in the archive

### POST /cohorts/:cohortID/owners/:owner
Add `owner` as a co-owner of the cohort `cohortID`. `owner` should be a URL component encoded email address. The invited co-owner will receive an email inviting them to join the cohort as a co-owner. Returns status code 201 on success.

### DELETE /cohorts/:cohortID/owners/:owner
Remove `owner` as a co-owner of the cohort `cohortID`. `owner` should be a URL component encoded email address.

### GET /cohorts/:cohortID/surveySets
List the survey sets inside the cohort `cohortID`.

### POST /cohorts/:cohortID/surveySets
Create a new survey set within the cohort `cohortID`.
* `name`: String
* `responseAcceptancePeriod`: Number representing the number of days after the survey is sent for which responses will be accepted.
* `surveys`: Array of survey objects
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* `date`: a JavaScript-parsable date representation, such as the number of milliseconds since 1 January 1970 00:00:00 UTC or an ISO 8601 compliant date string (such as `2018-04-25T01:45:33+00:00`).
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* `name`: a String representing the name of the survey on this date (such as "Homework 1")
* `questions`: Array of question objects

### PATCH /cohorts/:cohortID/surveySets/:surveySetID
Modify an existing survey set within the cohort `cohortID`. Request with one or more of the following attributes to modify.
* `name`: String
* `responseAcceptancePeriod`: Number representing the number of days after the survey is sent for which responses will be accepted.
* `surveys`: Array of survey objects
* `surveys[].date`: a JavaScript-parsable date representation, such as the number of milliseconds since 1 January 1970 00:00:00 UTC or an ISO 8601 compliant date string (such as `2018-04-25T01:45:33+00:00`).
* `surveys[].name`: a String representing the name of the survey on this date (such as "Homework 1")
* `questions`: Array of question objects

### GET /cohorts/:cohortID/surveySets/:surveySetID
Get the contents of the survey set (name, questions, responses, etc…)
