import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { RoleType } from '../../shared/models/user.model';

/**
 * ROLE GUARD: "Người gác cổng" kiểm tra vai trò người dùng (ADMIN, STAFF, BRANCHMANAGER...).
 * Mỗi lần chuyển màn hình: Kiểm tra role có đủ điều kiện không.
 * Nếu không đủ điều kiện: Bắn thông báo Toast màu đỏ lên màn hình chính và chặn chuyển trang.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // BƯỚC 1: Lấy danh sách Roles yêu cầu được khai báo trong app.routes.ts
  const expectedRoles = route.data?.['roles'] as RoleType[] | undefined;

  // Nếu route không yêu cầu role cụ thể -> cho phép truy cập tự do
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  // BƯỚC 2: Kiểm tra xem User hiện tại có chứa ít nhất 1 trong các role yêu cầu hay không
  const hasPermission = authService.hasAnyRole(expectedRoles);

  if (hasPermission) {
    return true; // Hợp lệ, cho phép mở trang
  }

  // BƯỚC 3: Nếu không đủ quyền -> Hiển thị thông báo Toast màu đỏ lên màn hình chính
  toastService.error('Cảnh báo: Bạn không có quyền truy cập vào chức năng này!');

  // BƯỚC 4: Nếu người dùng truy cập trực tiếp bằng gõ URL thì chuyển về trang chủ, nếu đang trong app thì giữ nguyên
  if (!router.navigated) {
    router.navigate(['/']);
  }

  return false; // Chặn không cho phép chuyển trang
};

