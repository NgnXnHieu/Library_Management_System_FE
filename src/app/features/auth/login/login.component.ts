import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * COMPONENT ĐĂNG NHẬP:
 * - Validate form giống 100% Backend (Username >= 10 ký tự; Password >= 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt).
 * - Gọi API đăng nhập để nhận Cookie xác thực và JSON role, username, fullName.
 * - Lưu role, hiển thị thông báo Toast thành công lên màn hình chính và chuyển hướng đến màn hình tương ứng.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public isLoading: boolean = false;
  public errorMessage: string = '';

  /**
   * BƯỚC 1: Khởi tạo REACTIVE FORM với các quy tắc Validate khớp chuẩn với Backend (LoginRequestForm).
   */
  public loginForm: FormGroup = this.fb.group({
    username: ['', [
      Validators.required,
      Validators.minLength(10) // Khớp @Size(min = 10)
    ]],
    password: ['', [
      Validators.required,
      // Khớp Pattern: Ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/)
    ]]
  });

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    // Nếu người dùng bị Guard chặn và đẩy về trang /login kèm returnUrl
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.errorMessage = 'Bạn cần đăng nhập tài khoản để truy cập chức năng yêu cầu!';
    }
  }

  /**
   * BƯỚC 2: Xử lý sự kiện khi người dùng nhấn "Đăng Nhập".
   */
  onSubmit(): void {
    this.errorMessage = '';

    // Nếu form không hợp lệ: Đánh dấu tất cả ô input là touched để hiện thông báo lỗi đỏ
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    // BƯỚC 3: Gọi API đăng nhập sang Backend Spring Boot
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Bắn thông báo Toast thành công màu xanh lên góc màn hình chính
        this.toastService.success(`Đăng nhập thành công! Chào mừng ${response.data.fullName}.`);

        // Điều hướng về màn hình tương ứng với vai trò (Role)
        let targetUrl = this.route.snapshot.queryParams['returnUrl'];
        if (!targetUrl) {
          const role = response.data.role;
          if (role === 'ROLE_ADMIN') {
            targetUrl = '/admin/dashboard';
          } else if (role === 'ROLE_BRANCHMANAGER') {
            targetUrl = '/manager/dashboard';
          } else if (role === 'ROLE_STAFF') {
            targetUrl = '/staff/dashboard';
          } else {
            targetUrl = '/';
          }
        }
        this.router.navigateByUrl(targetUrl);
      },
      error: (error) => {
        this.isLoading = false;

        // Bắt lỗi chi tiết theo từng mã HTTP
        if (error.status === 404) {
          this.errorMessage = 'Không tìm thấy API xác thực (Lỗi 404: Kiểm tra context-path /api)!';
        } else if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến máy chủ Backend (Port 8080)!';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Tài khoản hoặc mật khẩu không chính xác!';
        }

        // Bắn thông báo Toast màu đỏ lên góc màn hình
        this.toastService.error(this.errorMessage);
        console.error('[LoginComponent] Đăng nhập thất bại:', error);
      }
    });
  }
}
