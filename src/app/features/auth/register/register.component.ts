import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Validator tùy chỉnh kiểm tra mật khẩu xác nhận có khớp với mật khẩu chính hay không
 */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  // Chỉ trả về lỗi nếu cả 2 trường đều đã nhập và không khớp nhau
  if (confirmPassword.value && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  } else if (confirmPassword.hasError('passwordMismatch')) {
    // Xóa lỗi passwordMismatch nếu đã khớp
    const errors = { ...confirmPassword.errors };
    delete errors['passwordMismatch'];
    confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
  }

  return null;
};

/**
 * COMPONENT ĐĂNG KÝ TÀI KHOẢN (REGISTER):
 * - Validate chặt chẽ khớp 100% Backend RegisterRequestForm:
 *   + fullName: Không để trống
 *   + username: Tối thiểu 10 ký tự
 *   + email: Định dạng email hợp lệ
 *   + phone: 10 - 11 chữ số
 *   + password: Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
 *   + confirmPassword: Trùng khớp với password
 * - Gọi API đăng ký: Thành công chuyển hướng sang /login, lỗi hiển thị cảnh báo lên màn hình.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  public isLoading: boolean = false;
  public errorMessage: string = '';
  public showPassword: boolean = false;
  public showConfirmPassword: boolean = false;

  /**
   * BƯỚC 1: Khởi tạo REACTIVE FORM với đầy đủ ràng buộc validation
   */
  public registerForm: FormGroup = this.fb.group({
    fullName: ['', [
      Validators.required
    ]],
    username: ['', [
      Validators.required,
      Validators.minLength(10) // Khớp @Size(min = 10)
    ]],
    email: ['', [
      Validators.required,
      Validators.email // Khớp @Email
    ]],
    phone: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]{10,11}$/) // Khớp @Pattern(regexp = "^[0-9]{10,11}$")
    ]],
    password: ['', [
      Validators.required,
      // Khớp Pattern: Ít nhất 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/)
    ]],
    confirmPassword: ['', [
      Validators.required
    ]]
  }, { validators: passwordMatchValidator });

  get f() {
    return this.registerForm.controls;
  }

  /**
   * Bật/tắt hiển thị mật khẩu
   */
  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * BƯỚC 2: Xử lý sự kiện khi người dùng bấm nút "Đăng Ký Tài Khoản"
   */
  onSubmit(): void {
    this.errorMessage = '';

    // Nếu form không hợp lệ: Đánh dấu tất cả ô input là touched để hiện thông báo lỗi đỏ
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.warning('Vui lòng kiểm tra và điền đầy đủ, chính xác các trường thông tin!');
      return;
    }

    this.isLoading = true;
    const { fullName, username, email, phone, password } = this.registerForm.value;

    // BƯỚC 3: Gọi API đăng ký tài khoản sang Backend Spring Boot
    this.authService.register({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Bắn thông báo Toast thành công màu xanh
        this.toastService.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');

        // Điều hướng người dùng về màn hình Đăng nhập
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;

        // Bắt lỗi chi tiết từ Backend
        if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến máy chủ Backend (Port 8080)!';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.error?.fieldErrors) {
          // Tổng hợp lỗi validation từ backend nếu có
          const fieldMsgs = Object.values(error.error.fieldErrors).join(', ');
          this.errorMessage = `Dữ liệu không hợp lệ: ${fieldMsgs}`;
        } else {
          this.errorMessage = 'Đăng ký tài khoản thất bại. Vui lòng thử lại sau!';
        }

        // Bắn Toast thông báo lỗi màu đỏ lên góc màn hình
        this.toastService.error(this.errorMessage);
        console.error('[RegisterComponent] Đăng ký thất bại:', error);
      }
    });
  }
}
