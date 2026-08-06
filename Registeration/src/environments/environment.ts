// Central place for backend base URLs.
// authApi  -> RegistrationBack (login/register/otp/password)  -> port 3000
// cloudApi -> cloudsBack (providers + files, per-user OAuth)   -> port 3100
export const environment = {
  production: false,
  authApi: 'http://localhost:3000',
  cloudApi: 'http://localhost:3100',
};
