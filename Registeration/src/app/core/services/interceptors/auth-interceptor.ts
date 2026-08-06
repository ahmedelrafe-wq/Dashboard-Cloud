import { HttpInterceptorFn } from '@angular/common/http';

// Attaches the login JWT (saved by login.ts as 'token') to every outgoing
// request as `Authorization: Bearer <token>`. Both backends read this header:
// RegistrationBack's protected routes and cloudsBack's per-user cloud routes.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
