import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

/**
 * MÀN HÌNH DASHBOARD RIÊNG CHO QUẢN LÝ CHI NHÁNH (BRANCH MANAGER)
 * Quản trị nhân sự chi nhánh, chỉ số doanh thu phí phạt quá hạn, và luân chuyển sách.
 */
@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.css'
})
export class ManagerDashboardComponent {
  public authService = inject(AuthService);

  get user(): User | null {
    return this.authService.currentUser();
  }

  public stats = [
    { title: 'Doanh Thu Phí Phạt Tháng Này', value: '8,450,000 đ', change: '+14% so với tháng trước', icon: '💰', colorClass: 'emerald' },
    { title: 'Tỷ Lệ Sách Đang Lưu Thông', value: '84.2%', change: 'Kho hoạt động hiệu quả', icon: '📈', colorClass: 'blue' },
    { title: 'Nhân Sự Đang Trong Ca Trực', value: '4 / 6 người', change: 'Ca sáng (08:00 - 17:00)', icon: '👥', colorClass: 'amber' },
    { title: 'Sách Hỏng Chờ Quyết Định', value: '7 cuốn', change: 'Cần duyệt thanh lý', icon: '⚠️', colorClass: 'red' }
  ];

  public staffRoster = [
    { name: 'Nguyễn Văn Minh', role: 'Thủ thư quầy 1', handledSlips: 42, status: 'ĐANG TRỰC' },
    { name: 'Trần Thị Thu Thảo', role: 'Thủ thư quầy 2', handledSlips: 38, status: 'ĐANG TRỰC' },
    { name: 'Lê Hoàng Long', role: 'Kiểm kê kho', handledSlips: 15, status: 'ĐANG TRỰC' },
    { name: 'Phạm Thị Ngọc', role: 'Ca chiều', handledSlips: 0, status: 'CHƯA VÀO CA' }
  ];
}
