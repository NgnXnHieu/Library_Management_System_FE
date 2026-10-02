import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { LoginResponseData, RoleType, User } from '../../shared/models/user.model';

/**
 * SERVICE QUẢN LÝ XÁC THỰC VÀ PHÂN QUYỀN (AUTH SERVICE)
 * - Token JWT được lưu an toàn trong Cookies (HttpOnly) của trình duyệt.
 * - Thông tin User & Role được lưu trữ trong localStorage và Signal để phục vụ hiển thị & phân quyền.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly USER_KEY = 'library_user_profile';

  // Quản lý trạng thái bằng Angular Signal phản ứng nhanh
  public currentUser = signal<User | null>(this.getStoredUser());
  public isAuthenticated = signal<boolean>(!!this.getStoredUser());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Gọi API đăng nhập tài khoản vào hệ thống Spring Boot.
   * Gửi request kèm withCredentials: true để nhận Set-Cookie từ Backend.
   * JSON trả về chứa: role, username, fullName.
   */
  login(credentials: { username: string; password: string }): Observable<ApiResponse<LoginResponseData>> {
    return this.http.post<ApiResponse<LoginResponseData>>(
      `${environment.apiUrl}/public/auth/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Lưu thông tin Role, Username, FullName từ JSON trả về
          const user: User = {
            username: response.data.username,
            fullName: response.data.fullName,
            roles: [response.data.role]
          };
          this.saveAuthData(user);
        }
      })
    );
  }

  /**
   * Đăng xuất khỏi hệ thống:
   * 1. Bắn request sang Backend POST /auth/logout để xóa Cookie và vô hiệu hóa token trong DB.
   * 2. Xóa sạch dữ liệu trong localStorage và điều hướng về trang /login.
   */
  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.logoutLocal(),
      error: () => this.logoutLocal()
    });
  }

  /**
   * Xóa sạch dữ liệu đăng nhập phía Client và điều hướng về /login.
   */
  logoutLocal(): void {
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Lưu thông tin User & Role vào localStorage và cập nhật Signal.
   */
  private saveAuthData(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  /**
   * Lấy thông tin User hiện tại từ localStorage.
   */
  getStoredUser(): User | null {
    const rawUser = localStorage.getItem(this.USER_KEY);
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra xem người dùng hiện tại có chứa Role được yêu cầu hay không.
   */
  hasAnyRole(requiredRoles: RoleType[]): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(role => requiredRoles.includes(role));
  }
}
