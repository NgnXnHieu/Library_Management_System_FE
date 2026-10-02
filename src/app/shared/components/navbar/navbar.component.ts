import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Component thanh điều hướng (Navbar) trên cùng của trang web.
 * Tự động đổi menu tùy theo trạng thái chưa đăng nhập hay đã đăng nhập.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // Inject AuthService để theo dõi trạng thái đăng nhập và thông tin User
  public authService = inject(AuthService);

  // Hàm xử lý khi bấm nút Đăng xuất
  onLogout(): void {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      this.authService.logout();
    }
  }
}
