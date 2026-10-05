/**
 * Enum trạng thái hiển thị của thể loại sách:
 * - 'HIDE': Đang ẩn (không hiển thị công khai)
 * - 'UNHIDE': Đang hiển thị công khai bình thường
 */
export type DisplayStatus = 'HIDE' | 'UNHIDE';

/**
 * Interface DTO thể loại sách nhận từ Backend
 */
export interface CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  status: DisplayStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface DTO rút gọn cho thể loại sách (phục vụ menu dropdown và bộ lọc)
 */
export interface CategorySimpleDto {
  id: number;
  name: string;
}

/**
 * Interface tham số lọc danh sách thể loại sách
 */
export interface CategoryFilterRequest {
  name?: string;
  description?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/**
 * Interface dữ liệu tạo mới thể loại sách
 */
export interface CategoryCreateRequest {
  name: string;
  description?: string;
  status: DisplayStatus;
}

/**
 * Interface dữ liệu cập nhật thể loại sách
 */
export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  status?: DisplayStatus;
}
