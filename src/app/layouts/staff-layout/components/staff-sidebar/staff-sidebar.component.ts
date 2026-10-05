import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * NAVBAR PHÍA BÊN TRÁI DÀNH RIÊNG CHO NHÂN VIÊN QUẦY (STAFF)
 * Chỉ hiển thị các chức năng phục vụ tác vụ mượn/trả, tra cứu tại quầy.
 */
@Component({
  selector: 'app-staff-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-sidebar.component.html',
  styleUrl: './staff-sidebar.component.css'
})
export class StaffSidebarComponent {
  public authService = inject(AuthService);

  public currentUser = this.authService.currentUser;

  // Danh mục menu riêng của nhân viên quầy
  public menuItems = [
    { title: 'Bàn Làm Việc Quầy', icon: '📊', route: '/staff/dashboard' },
    { title: 'Lập Phiếu Mượn', icon: '📝', route: '/staff/create-slip' },
    { title: 'Xử Lý Mượn / Trả', icon: '📋', route: '/staff/borrow-slips' },
    { title: 'Tra Cứu Kho Sách', icon: '📚', route: '/staff/inventory' },
    { title: 'Hồ Sơ Khách Hàng', icon: '👥', route: '/staff/patrons' }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
