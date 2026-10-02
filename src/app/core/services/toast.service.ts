import { Injectable, signal } from '@angular/core';

/**
 * Kiểu loại thông báo Toast:
 * - 'success': Thông báo thành công (Màu xanh lá)
 * - 'error': Thông báo lỗi / Thất bại (Màu đỏ)
 * - 'warning': Thông báo cảnh báo / Chưa đăng nhập (Màu vàng cam)
 * - 'info': Thông báo thông tin chung (Màu xanh dương)
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Cấu trúc đối tượng một thông báo Toast hiển thị trên màn hình
 */
export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration: number; // Thời gian hiển thị (mili-giây)
}

/**
 * SERVICE QUẢN LÝ THÔNG BÁO NỔI TOÀN CỤC (TOAST NOTIFICATION SERVICE)
 * - Quản lý danh sách các thông báo nổi trên màn hình bằng Angular Signal phản ứng nhanh.
 * - Tự động xóa thông báo sau khoảng thời gian đếm ngược chỉ định.
 * - Cho phép gọi từ bất kỳ đâu: Guard, Interceptor, Service, Component.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {

  // Biến đếm ID tự tăng cho mỗi thông báo
  private counter: number = 0;

  // Signal chứa danh sách các Toast đang hiển thị trên màn hình
  public toasts = signal<ToastMessage[]>([]);

  /**
   * BƯỚC 1: Hàm đẩy một thông báo mới lên màn hình
   * @param message Nội dung thông báo
   * @param type Loại thông báo ('success' | 'error' | 'warning' | 'info')
   * @param duration Thời gian tồn tại (mặc định 4000ms = 4 giây)
   */
  show(message: string, type: ToastType = 'info', duration: number = 4000): void {
    const id = ++this.counter;
    const newToast: ToastMessage = { id, message, type, duration };

    // Cập nhật Signal danh sách Toast
    this.toasts.update(current => [...current, newToast]);

    // BƯỚC 2: Tự động đóng thông báo sau khi hết thời gian duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Tiện ích: Bắn thông báo Thành công (Màu xanh lá)
   */
  success(message: string, duration: number = 4000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Tiện ích: Bắn thông báo Lỗi hoặc Không đủ quyền (Màu đỏ)
   */
  error(message: string, duration: number = 4500): void {
    this.show(message, 'error', duration);
  }

  /**
   * Tiện ích: Bắn thông báo Cảnh báo hoặc Chưa đăng nhập (Màu vàng cam)
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Tiện ích: Bắn thông báo Thông tin chung (Màu xanh dương)
   */
  info(message: string, duration: number = 4000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Xóa một thông báo ra khỏi màn hình theo ID (khi người dùng bấm nút đóng 'x' hoặc hết giờ)
   */
  remove(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  /**
   * Xóa toàn bộ thông báo đang hiển thị
   */
  clear(): void {
    this.toasts.set([]);
  }
}
