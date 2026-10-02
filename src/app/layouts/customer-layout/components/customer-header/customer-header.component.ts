import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * HEADER DÀNH CHO KHÁCH HÀNG (CUSTOMER / PUBLIC VIEW)
 * Bao gồm: Logo, Thanh tìm kiếm sách, Điều hướng (Trang chủ, Thể loại, Phiếu mượn),
 * Nút chuyển sang đúng phân hệ quản trị (Staff / Manager / Admin) và Icon tài khoản.
 */
@Component({
  selector: 'app-customer-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-header.component.html',
  styleUrl: './customer-header.component.css'
})
export class CustomerHeaderComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  public searchKeyword: string = '';
  public isUserDropdownOpen: boolean = false;

  get isStoreStaff(): boolean {
    return this.authService.hasAnyRole(['ROLE_ADMIN', 'ROLE_BRANCHMANAGER', 'ROLE_STAFF']);
  }

  /**
   * Tính toán đường dẫn phân hệ nội bộ tương ứng với quyền của tài khoản
   */
  get portalRoute(): string {
    if (this.authService.hasAnyRole(['ROLE_ADMIN'])) {
      return '/admin/dashboard';
    }
    if (this.authService.hasAnyRole(['ROLE_BRANCHMANAGER'])) {
      return '/manager/dashboard';
    }
    if (this.authService.hasAnyRole(['ROLE_STAFF'])) {
      return '/staff/dashboard';
    }
    return '/';
  }

  get portalLabel(): string {
    if (this.authService.hasAnyRole(['ROLE_ADMIN'])) return 'Super Admin';
    if (this.authService.hasAnyRole(['ROLE_BRANCHMANAGER'])) return 'Quản Lý Chi Nhánh';
    return 'Bàn Trực Quầy';
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      console.log('Tìm kiếm sách với từ khóa:', this.searchKeyword);
    }
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  onLogout(): void {
    this.isUserDropdownOpen = false;
    this.authService.logout();
  }
}
