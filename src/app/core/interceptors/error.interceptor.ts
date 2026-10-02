import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Location } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * INTERCEPTOR XỬ LÝ LỖI TOÀN CỤC:
 * - Mã 401 (Chưa đăng nhập / Token hết hạn): Hiển thị Toast cảnh báo lên màn hình và điều hướng về /login.
 * - Mã 403 (Không đủ quyền): Hiển thị Toast cảnh báo đỏ không đủ quyền và quay trở về màn hình trước đó.
 * - Mã 500+ (Lỗi máy chủ): Hiển thị Toast cảnh báo sự cố máy chủ lên màn hình.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const location = inject(Location);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Trường hợp 1: Mã 401 UNAUTHORIZED (Chưa đăng nhập hoặc Cookie hết hạn)
      if (error.status === 401) {
        toastService.warning('Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập lại!');
        authService.logoutLocal();
      }

      // Trường hợp 2: Mã 403 FORBIDDEN (Gọi API bị chặn bởi @PreAuthorize)
      else if (error.status === 403) {
        toastService.error('Cảnh báo: Bạn không đủ quyền thực hiện thao tác này!');
        // Quay trở về màn hình trước đó
        location.back();
      }

      // Trường hợp 3: Mã 500+ INTERNAL SERVER ERROR (Lỗi máy chủ)
      else if (error.status >= 500) {
        toastService.error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau!');
      }

      return throwError(() => error);
    })
  );
};

