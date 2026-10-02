import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * CẤU HÌNH TOÀN CỤC CỦA ỨNG DỤNG ANGULAR (Standalone Configuration).
 * Đăng ký Router, HttpClient và cấu hình các Interceptor bắt request/response.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Tối ưu hóa cơ chế kiểm tra thay đổi giao diện (Change Detection)
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Cung cấp Router với hiệu ứng chuyển trang mượt mà
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // Cung cấp HttpClient và đăng ký chuỗi Interceptors:
    // 1. authInterceptor: Gắn Token JWT
    // 2. errorInterceptor: Bắt lỗi HTTP 401, 403, 500
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor
      ])
    )
  ]
};
