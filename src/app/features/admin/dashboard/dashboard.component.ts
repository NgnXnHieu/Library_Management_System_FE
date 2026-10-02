import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * BẢNG ĐIỀU KHIỂN TOÀN HỆ THỐNG CHO QUẢN TRỊ VIÊN TỐI CAO (SUPER ADMIN)
 * Giám sát hoạt động của toàn bộ 5 chi nhánh, các chỉ số vĩ mô và tài khoản hệ thống.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent {
  public authService = inject(AuthService);

  // Chỉ số vĩ mô toàn chuỗi thư viện
  public stats = [
    { title: 'Chi Nhánh Đang Hoạt Động', value: '5 / 5', change: 'Hà Nội, HCM, Đà Nẵng...', icon: '🏛️', colorClass: 'purple' },
    { title: 'Tổng Sách Toàn Chuỗi', value: '14,850', change: 'Được phân bổ tại 5 kho', icon: '📚', colorClass: 'green' },
    { title: 'Lượt Mượn Toàn Quốc Tuần Này', value: '1,420', change: '+18% so với tuần trước', icon: '📈', colorClass: 'blue' },
    { title: 'Tổng Tài Khoản Độc Giả & Nhân Viên', value: '5,280', change: '+32 tài khoản mới tuần này', icon: '👥', colorClass: 'amber' }
  ];

  // Bảng theo dõi tình hình 5 chi nhánh
  public branchPerformance = [
    { name: 'Chi nhánh Hà Nội - Ba Đình', manager: 'Trần Văn Mạnh', totalBooks: 4500, activeLoans: 310, status: 'BÌNH THƯỜNG' },
    { name: 'Chi nhánh TP.HCM - Quận 1', manager: 'Nguyễn Thị Bích', totalBooks: 5200, activeLoans: 420, status: 'BÌNH THƯỜNG' },
    { name: 'Chi nhánh Đà Nẵng - Hải Châu', manager: 'Lê Văn Khang', totalBooks: 2800, activeLoans: 180, status: 'BÌNH THƯỜNG' },
    { name: 'Chi nhánh Cần Thơ - Ninh Kiều', manager: 'Võ Minh Trí', totalBooks: 1500, activeLoans: 95, status: 'BÌNH THƯỜNG' },
    { name: 'Chi nhánh Hải Phòng - Hồng Bàng', manager: 'Đỗ Thị Hạnh', totalBooks: 850, activeLoans: 45, status: 'MỚI MỞ' }
  ];
}
