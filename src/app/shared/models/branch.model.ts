/**
 * Enum trạng thái hoạt động của chi nhánh:
 * - 'OPEN': Chi nhánh đang mở cửa hoạt động bình thường
 * - 'CLOSED': Chi nhánh tạm dừng hoạt động
 */
export type BranchStatus = 'OPEN' | 'CLOSED';

/**
 * Interface DTO chi nhánh nhận từ Backend
 */
export interface BranchResponseDto {
  id: number;
  code: string;
  name: string;
  address: string;
  phone?: string;
  status: BranchStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface tham số lọc danh sách chi nhánh
 */
export interface BranchFilterRequest {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/**
 * Interface dữ liệu tạo mới chi nhánh
 */
export interface BranchCreateRequest {
  code: string;
  name: string;
  address: string;
  phone?: string;
  status: BranchStatus;
  imageUrl?: string;
}

/**
 * Interface dữ liệu cập nhật chi nhánh
 */
export interface BranchUpdateRequest {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  status?: BranchStatus;
  imageUrl?: string;
}
