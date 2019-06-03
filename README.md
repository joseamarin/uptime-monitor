An "uptime monitor" allows users to enter URLs they want monitored,
and receive alerts when those resources "go down" or "come back up".

1. The app should be usable, so it should include features such as
user sign-up and sign-in.

2. The app should include functionality for sending an SMS alert
to a user, rather than email.

**Backend spec requirements**

- The API listens on a PORT and accepts incoming HTTP requests for
POST, GET, PUT, DELETE and HEAD.

- The API allows a client to connect, then create a new user,
then edit and delete that user.

- The API allows a user to "sign in" which gives them a token,
that they can use for subsequent authenticated requests.

- The API allows the user to "sign out" which invalidates their token.

- The API allows a signed-in user to use their token to crate a new "check".

- The API allows a sign-in user to edit or delete any of their checks.

- In the background, workers perform all the "checks" at the appropriate times
and send alerts to the users when a check changes it's state
from "up" to "down", or vise versa.

- The alerts will be sent via SMS, using Twilio

- Since this project is not using any frameworks or packages the database will
just be a writing files to the disk and storing json
