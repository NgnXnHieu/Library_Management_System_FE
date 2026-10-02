import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * AUTH GUARD: "Người gác cổng" kiểm tra trạng thái đăng nhập.
 * Chặn không cho người dùng chưa đăng nhập truy cập vào các trang bảo vệ.
 * Hiển thị cảnh báo trực tiếp lên màn hình chính và chuyển hướng về /login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // BƯỚC 1: Nếu đã đăng nhập thành công (có thông tin xác thực)
  if (authService.isAuthenticated()) {
    return true; // Cho phép đi tiếp vào trang
  }

  // BƯỚC 2: Nếu chưa đăng nhập -> Bắn thông báo nổi bật lên màn hình chính
  toastService.warning('Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập chức năng này.');

  // BƯỚC 3: Điều hướng ngay về màn hình Login kèm lưu lại đường dẫn gốc (returnUrl)
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false; // Chặn lại không cho vào trang bảo vệ
};

