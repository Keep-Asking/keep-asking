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
Get an existing cohort

### PATCH /cohorts/:cohortID
Update an existing cohort. Send one or more of the following:
* `name`: String
* `members` (optional): Array of strings of email addresses of the members of the cohort
* `demographicQuestions` (optional): Array of questions
Returns status code 200 on success.
* `archive` (optional): Boolean indicating whether this cohort should be in the archive

### POST /cohorts/:cohortID/owners/:owner
Add `owner` as a co-owner of the cohort `cohortID`. `owner` should be a URL component encoded email address. The invited co-owner will receive an email inviting them to join the cohort as a co-owner. Returns status code 201 on success.

### DELETE /cohorts/:cohortID/owners/:owner
Remove `owner` as a co-owner of the cohort `cohortID`. `owner` should be a URL component encoded email address.
