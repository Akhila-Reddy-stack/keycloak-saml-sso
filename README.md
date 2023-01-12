# Keycloak
# Single SingleOn: Service Provide (SP) Client
#### Run app in local

```
//Install dependency module
npm install 

//Ensure it app root directory & Run the application using the command
node app.js
```

- Go the browser and navigate to home page : https://localhost:5000/
- Navigate to login page: https://localhost:5000/login app will redirect to IDP for login process and post login it will redirect to call back url with SAML assertion token with claims container user details
