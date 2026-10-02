/**
 * Interface chuẩn cho toàn bộ phản hồi từ Spring Boot Backend.
 * Tương ứng với class com.library.dto.response.ApiResponse<T> trong Backend.
 */
export interface ApiResponse<T> {
  success: boolean;       // Trạng thái thành công hay thất bại
  message: string;        // Thông điệp phản hồi (ví dụ: "Lấy danh sách phiếu mượn thành công!")
  data: T;                // Dữ liệu thực tế trả về
  errors?: any;           // Chi tiết lỗi (nếu có)
  timestamp: string;      // Thời gian server trả về
}

/**
 * Interface cấu trúc phân trang của Spring Data JPA Page<T>.
 */
export interface PageResponse<T> {
  content: T[];           // Danh sách phần tử trong trang hiện tại
  totalElements: number;  // Tổng số bản ghi trong toàn hệ thống
  totalPages: number;     // Tổng số trang
  size: number;           // Số phần tử trên 1 trang
  number: number;         // Chỉ số trang hiện tại (bắt đầu từ 0)
}
