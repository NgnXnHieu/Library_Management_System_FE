import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * NAVBAR PHÍA BÊN TRÁI DÀNH RIÊNG CHO QUẢN LÝ CHI NHÁNH (BRANCH MANAGER)
 * Quản trị toàn bộ nhân sự, kho sách, và báo cáo doanh thu phạt tại chi nhánh đó.
 */
@Component({
  selector: 'app-manager-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-sidebar.component.html',
  styleUrl: './manager-sidebar.component.css'
})
export class ManagerSidebarComponent {
  public authService = inject(AuthService);

  public currentUser = this.authService.currentUser;

  // Danh mục menu riêng của Quản lý chi nhánh
  public menuItems = [
    { title: 'Tổng Quan Chi Nhánh', icon: '📊', route: '/manager/dashboard' },
    { title: 'Quản Lý Kho Chi Nhánh', icon: '📦', route: '/manager/inventory' },
    { title: 'Giám Sát Mượn / Trả', icon: '📋', route: '/manager/borrow-slips' },
    { title: 'Nhân Sự Chi Nhánh', icon: '👔', route: '/manager/staff' },
    { title: 'Báo Cáo & Phí Phạt', icon: '📈', route: '/manager/reports' }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
