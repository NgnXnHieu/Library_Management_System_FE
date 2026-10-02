import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import {
  AccountCreateRequest,
  AccountStatus,
  UserAdminFilterRequest,
  UserResponseDto,
  UserUpdateRequest
} from '../../../../shared/models/user.model';

/**
 * SERVICE QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG PHÍA ADMIN (USER SERVICE)
 * Cung cấp các phương thức gọi API Backend Spring Boot cho phân hệ quản trị tài khoản
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Gọi API lấy danh sách phân trang người dùng kèm theo bộ lọc và sắp xếp
   * @param filter Đối tượng lọc chứa searchName, role, branchName, statuses, page, size, sortBy, sortDir
   */
  getAdminUsers(filter: UserAdminFilterRequest): Observable<ApiResponse<PageResponse<UserResponseDto>>> {
    let params = new HttpParams();

    // Bước 1: Gắn các tham số lọc chuỗi văn bản nếu có giá trị
    if (filter.searchName && filter.searchName.trim()) {
      params = params.set('searchName', filter.searchName.trim());
    }
    if (filter.role && filter.role.trim()) {
      params = params.set('role', filter.role.trim());
    }
    if (filter.branchName && filter.branchName.trim()) {
      params = params.set('branchName', filter.branchName.trim());
    }

    // Bước 2: Gắn danh sách trạng thái statuses nếu có
    if (filter.statuses && filter.statuses.length > 0) {
      filter.statuses.forEach((s) => {
        params = params.append('statuses', s);
      });
    }

    // Bước 3: Gắn tham số phân trang và sắp xếp mặc định (createdAt mới nhất lên đầu)
    params = params.set('page', (filter.page ?? 0).toString());
    params = params.set('size', (filter.size ?? 10).toString());
    params = params.set('sortBy', filter.sortBy ?? 'createdAt');
    params = params.set('sortDir', filter.sortDir ?? 'desc');

    return this.http.get<ApiResponse<PageResponse<UserResponseDto>>>(
      `${this.baseUrl}/admin/users`,
      { params }
    );
  }

  /**
   * Gọi API tạo mới tài khoản bởi Admin (Dành riêng cho ADMIN)
   * @param data Dữ liệu tạo tài khoản (username, password, fullName, role, status, branchId, email, phone)
   */
  createAccountByAdmin(data: AccountCreateRequest): Observable<ApiResponse<UserResponseDto>> {
    return this.http.post<ApiResponse<UserResponseDto>>(
      `${this.baseUrl}/accounts/admin`,
      data
    );
  }

  /**
   * Gọi API cập nhật thông tin tài khoản người dùng
   * @param id ID người dùng cần cập nhật
   * @param data Dữ liệu cập nhật
   */
  updateUser(id: number, data: UserUpdateRequest): Observable<ApiResponse<UserResponseDto>> {
    return this.http.put<ApiResponse<UserResponseDto>>(
      `${this.baseUrl}/users/${id}`,
      data
    );
  }

  /**
   * Gọi API thay đổi nhanh trạng thái tài khoản (ACTIVE, INACTIVE, LOCKED)
   * @param id ID người dùng
   * @param status Trạng thái mới
   */
  changeUserStatus(id: number, status: AccountStatus): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/users/${id}/status`,
      null,
      { params }
    );
  }

  /**
   * Gọi API tìm kiếm độc giả (role CUSTOMER, status ACTIVE) phục vụ lập phiếu mượn
   * Tương ứng với backend: @GetMapping("/users/customer")
   * 
   * @param search Từ khóa tìm kiếm trong họ tên, username, số điện thoại, email
   */
  searchCustomers(search?: string): Observable<ApiResponse<UserResponseDto[]>> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<ApiResponse<UserResponseDto[]>>(
      `${this.baseUrl}/users/customer`,
      { params }
    );
  }
}
