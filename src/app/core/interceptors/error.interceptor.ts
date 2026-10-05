import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Biến cờ và hàng đợi (Queue) dùng để quản lý luồng Refresh Token đồng thời:
 * - isRefreshing: Đánh dấu đang có một request tiến hành refresh token.
 * - refreshTokenSubject: Báo hiệu cho các request khác đang chờ khi refresh token thành công hoặc thất bại.
 */
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

/**
 * INTERCEPTOR XỬ LÝ LỖI TOÀN CỤC:
 * - Mã 401 (Chưa đăng nhập / Token hết hạn):
 *   + Nếu là request thông thường: Tự động gọi Refresh Token trong âm thầm (Silent Refresh).
 *     * Thành công: Cập nhật User vào localStorage, nhận Cookie mới và gọi lại (Retry) request ban đầu.
 *     * Thất bại: Xóa sạch dữ liệu trong localStorage, hiện Toast cảnh báo và chuyển về trang /login.
 *   + Nếu chính request Login hoặc Refresh bị lỗi 401: Xóa dữ liệu và chuyển về /login ngay.
 * - Mã 403 (Không đủ quyền): Hiển thị Toast cảnh báo đỏ không đủ quyền và quay trở về màn hình trước đó.
 * - Mã 500+ (Lỗi máy chủ): Hiển thị Toast cảnh báo sự cố máy chủ lên màn hình.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const location = inject(Location);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // =======================================================================
      // TRƯỜNG HỢP 1: MÃ 401 UNAUTHORIZED (AccessToken hết hạn hoặc chưa đăng nhập)
      // =======================================================================
      if (error.status === 401) {
        const isAuthRequest = req.url.includes('/auth/login') ||
                              req.url.includes('/public/auth/login') ||
                              req.url.includes('/auth/refresh') ||
                              req.url.includes('/public/auth/refresh');

        // 1.1. Nếu chính request Login hoặc Refresh bị 401: Đăng xuất ngay lập tức
        if (isAuthRequest) {
          isRefreshing = false;
          refreshTokenSubject.next(false);
          authService.logoutLocal();
          toastService.warning('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!');
          return throwError(() => error);
        }

        // 1.2. Nếu đã có 1 request khác đang trong quá trình Refresh Token:
        // Đưa request này vào hàng đợi (Queue), chờ đến khi Refresh xong rồi retry
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            filter(success => success !== null),
            take(1),
            switchMap(success => {
              if (success) {
                // Refresh thành công: Gọi lại request ban đầu với Cookie mới
                return next(req.clone({ withCredentials: true }));
              }
              // Refresh thất bại: Ném lỗi ra ngoài
              return throwError(() => error);
            })
          );
        }

        // 1.3. Request đầu tiên phát hiện 401: Bắt đầu tiến trình Refresh Token
        isRefreshing = true;
        refreshTokenSubject.next(null); // Đặt trạng thái đang chờ

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            // Báo hiệu cho các request khác đang chờ biết là đã refresh thành công
            refreshTokenSubject.next(true);

            // Tự động gọi lại (Retry) request ban đầu bị lỗi với Cookie mới
            return next(req.clone({ withCredentials: true }));
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            // Báo hiệu refresh thất bại cho các request đang chờ
            refreshTokenSubject.next(false);

            // Xóa sạch thông tin cũ trong localStorage và điều hướng về trang /login
            authService.logoutLocal();
            toastService.warning('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!');
            return throwError(() => refreshError);
          })
        );
      }

      // =======================================================================
      // TRƯỜNG HỢP 2: MÃ 403 FORBIDDEN (Gọi API bị chặn bởi @PreAuthorize)
      // =======================================================================
      else if (error.status === 403) {
        toastService.error('Cảnh báo: Bạn không đủ quyền thực hiện thao tác này!');
        location.back();
      }

      // =======================================================================
      // TRƯỜNG HỢP 3: MÃ 500+ INTERNAL SERVER ERROR (Lỗi máy chủ)
      // =======================================================================
      else if (error.status >= 500) {
        toastService.error('Máy chủ đang gặp sự cố. Vui lòng thử lại sau!');
      }

      return throwError(() => error);
    })
  );
};


