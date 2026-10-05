import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CategoryService } from '../../../../core/services/category.service';
import { CategorySimpleDto } from '../../../../shared/models/category.model';

/**
 * HEADER DÀNH CHO KHÁCH HÀNG (CUSTOMER / PUBLIC VIEW)
 * Bao gồm: Logo, Thanh tìm kiếm sách, Điều hướng (Trang chủ, Thể loại Mega Dropdown, Phiếu mượn),
 * Nút chuyển sang đúng phân hệ quản trị (Staff / Manager / Admin) và Icon tài khoản.
 */
@Component({
  selector: 'app-customer-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-header.component.html',
  styleUrl: './customer-header.component.css'
})
export class CustomerHeaderComponent implements OnInit {
  public authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  public categories: CategorySimpleDto[] = [];
  public searchKeyword: string = '';
  public isUserDropdownOpen: boolean = false;

  ngOnInit(): void {
    // Tải danh sách thể loại active (UNHIDE) phục vụ menu dropdown ngang
    this.categoryService.getActiveCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
      },
      error: (err) => {
        console.error('[CustomerHeader] Lỗi tải thể loại:', err);
      }
    });
  }

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
    const keyword = this.searchKeyword.trim();
    this.router.navigate(['/books'], {
      queryParams: keyword ? { title: keyword } : {}
    });
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  onLogout(): void {
    this.isUserDropdownOpen = false;
    this.authService.logout();
  }
}
