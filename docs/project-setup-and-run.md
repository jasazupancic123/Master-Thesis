### Instructions to Run the Project

Follow these steps to set up and run the project:

1. Open a terminal window, navigate to the backend project folder, and start the Firebase emulator:

   ```bash
   cd ./fitcode/backend-nest-js
   npm run firebase:dev
   ```

2. Open another terminal window, navigate to the backend project folder again, and start the development server:
   ```bash
   cd ./fitcode/backend-nest-js
   npm run start:dev
   ```

- Check the logs to ensure there are no errors.

3. Open a third terminal window, navigate to the frontend project folder, and start the frontend:
   ```bash
   cd ./fitcode/frontend-next-js
   npm run dev
   ```
4. Open the frontend in your browser:

- Visit http://localhost:3000.
- Sign in using the selected user credentials.

> **_NOTE:_**
To verify the roles of the user you are signing in with, visit the following endpoint: http://127.0.0.1:4000/auth
