import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../../core/services/toast.service';

/**
 * COMPONENT HIỂN THỊ CÁC THÔNG BÁO TOAST NỔI TRÊN MÀN HÌNH CHÍNH (TOAST CONTAINER)
 * - Tự động đọc dữ liệu từ ToastService.toasts Signal.
 * - Hiển thị khung thông báo ở góc trên bên phải màn hình.
 * - Hỗ trợ các icon trực quan cho từng loại thông báo.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {

  // Inject ToastService để đọc danh sách thông báo và thực hiện đóng Toast
  public toastService = inject(ToastService);

  /**
   * Lấy icon trực quan tương ứng với loại thông báo
   */
  getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '🚫';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '🔔';
    }
  }

  /**
   * Lấy tiêu đề mặc định tương ứng với loại thông báo
   */
  getTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Thành Công';
      case 'error':
        return 'Lỗi Quyền Hạn / Thất Bại';
      case 'warning':
        return 'Cảnh Báo Xác Thực';
      case 'info':
        return 'Thông Tin';
      default:
        return 'Thông Báo';
    }
  }

  /**
   * Đóng một thông báo khi người dùng click vào nút 'x'
   */
  dismiss(id: number): void {
    this.toastService.remove(id);
  }
}
