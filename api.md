# Keep Asking API

## /cohorts

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
