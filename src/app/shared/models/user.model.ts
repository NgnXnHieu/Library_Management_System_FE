/**
 * Danh sách các Role vai trò trong hệ thống.
 * Tương ứng với các role được kiểm tra qua @PreAuthorize trong Backend Spring Boot.
 */
export type RoleType = 'ROLE_ADMIN' | 'ROLE_BRANCHMANAGER' | 'ROLE_STAFF' | 'ROLE_CUSTOMER';

/**
 * Trạng thái hoạt động của tài khoản người dùng
 */
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

/**
 * Mã vai trò người dùng (không kèm tiền tố ROLE_)
 */
export type RoleCode = 'ADMIN' | 'BRANCHMANAGER' | 'STAFF' | 'CUSTOMER';

/**
 * Interface thông tin tài khoản người dùng đăng nhập lưu trữ tại Frontend.
 */
export interface User {
  username: string;
  fullName: string;
  roles: RoleType[];
  branchName?: string;
}

/**
 * Interface kết quả trả về khi gọi API Đăng nhập thành công từ Backend.
 * Chỉ nhận role, username và fullName dưới dạng JSON (Token được lưu trong Cookie).
 */
export interface LoginResponseData {
  username: string;
  fullName: string;
  role: RoleType;
}

/**
 * Interface DTO thông tin người dùng nhận từ Backend API
 */
export interface UserResponseDto {
  userId: number;
  accountId: number;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth?: string;
  imageUrl?: string;
  address?: string;
  role: string;
  branchId?: number;
  branchName?: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface tham số lọc danh sách người dùng cho Admin
 */
export interface UserAdminFilterRequest {
  searchName?: string;
  role?: string;
  branchName?: string;
  statuses?: AccountStatus[];
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}

/**
 * Interface dữ liệu tạo mới tài khoản bởi Admin
 */
export interface AccountCreateRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
  status: AccountStatus;
  branchId: number;
  email: string;
  phone: string;
}

/**
 * Interface dữ liệu cập nhật thông tin người dùng
 */
export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  imageUrl?: string;
  address?: string;
  status?: AccountStatus;
  role?: string;
  branchId?: number;
}
