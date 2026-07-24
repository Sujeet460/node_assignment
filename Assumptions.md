## Assumptions & Design Decisions

## Additional Features Implemented

Although not explicitly required in the assignment, the following features were implemented to improve security and user experience:

* **Email Verification**

  * Every newly registered user must verify their email address before accessing the application.
  * If an unverified user attempts to log in, the system automatically sends a new OTP to the registered email address and returns a message prompting the user to verify their email.
  * The user can verify their account using the **Verify OTP** API.
  * Once the OTP is successfully verified, the user's email is marked as verified and they can log in normally.

* **Duplicate Task Assignment Prevention**

  * To maintain data integrity, the system prevents assigning the same task to the same user more than once.

## Assumptions

* Password reset and forgot password functionality were not implemented because they were not part of the assignment requirements.
* Email verification was implemented as an additional security enhancement, even though it was not explicitly required.
* Only the features specified in the assignment were considered mandatory; additional functionality was implemented where it improved security and data integrity.
