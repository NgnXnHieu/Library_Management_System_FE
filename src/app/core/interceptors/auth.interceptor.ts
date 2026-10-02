import { HttpInterceptorFn } from '@angular/common/http';

/**
 * INTERCEPTOR XÁC THỰC:
 * Tự động gắn withCredentials: true vào mọi HTTP request gửi đi,
 * giúp trình duyệt luôn tự động đính kèm Cookie accessToken/refreshToken sang Backend Spring Boot.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Luôn gửi kèm Cookie xác thực cho Backend
  const clonedRequest = req.clone({
    withCredentials: true
  });

  return next(clonedRequest);
};
