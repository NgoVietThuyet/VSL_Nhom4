import { HttpInterceptorFn } from '@angular/common/http';

/** Gửi HttpOnly refresh cookie cùng các request API (cross-origin có AllowCredentials). */
export const CredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Bypass-Auth')) {
    return next(req);
  }

  const url = req.url.toLowerCase();
  const isApiCall =
    url.includes('/api/') ||
    url.endsWith('/auth/refreshtoken') ||
    url.endsWith('/auth/logout');

  if (!isApiCall) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
