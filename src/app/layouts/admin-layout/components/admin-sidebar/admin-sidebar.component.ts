import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * NAVBAR PHÍA BÊN TRÁI DÀNH RIÊNG CHO QUẢN TRỊ VIÊN TỐI CAO (ADMIN)
 * Quản trị toàn bộ chuỗi chi nhánh, kho tổng, phân quyền tài khoản và cấu hình hệ thống.
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  public authService = inject(AuthService);

  public currentUser = this.authService.currentUser;

  // Danh mục menu riêng của Quản trị viên
  public menuItems = [
    { title: 'Bảng Điều Khiển Toàn Cầu', icon: '📊', route: '/admin/dashboard' },
    { title: 'Quản Lý Chi Nhánh', icon: '🏛️', route: '/admin/branches' },
    { title: 'Quản Lý Đầu Sách', icon: '📖', route: '/admin/books' },
    { title: 'Kho Sách Toàn Hệ Thống', icon: '📚', route: '/admin/inventory' },
    { title: 'Quản Lý Phiếu Mượn', icon: '📋', route: '/admin/borrow-slips' },
    { title: 'Danh Mục Thể Loại', icon: '📑', route: '/admin/categories' },
    { title: 'Tài Khoản & Phân Quyền', icon: '🔑', route: '/admin/users' },
    { title: 'Báo Cáo Tổng Hợp', icon: '📈', route: '/admin/reports' }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
