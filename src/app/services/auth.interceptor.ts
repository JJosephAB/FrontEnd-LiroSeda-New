import { HttpInterceptorFn } from '@angular/common/http';

const tokenKey = 'lirio-seda-token';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem(tokenKey);

  if (!token || request.url.endsWith('/auth/login')) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
