import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

/**
 * MÀN HÌNH DASHBOARD RIÊNG CHO NHÂN VIÊN QUẦY (STAFF)
 * Tập trung hoàn toàn vào tác vụ quầy: Tiếp đón độc giả, tạo phiếu mượn, nhận trả sách.
 */
@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css'
})
export class StaffDashboardComponent {
  public authService = inject(AuthService);

  get user(): User | null {
    return this.authService.currentUser();
  }

  public stats = [
    { title: 'Phiếu Tạo Trong Ca Trực', value: '18', change: 'Hôm nay', icon: '📝', colorClass: 'cyan' },
    { title: 'Sách Đến Hạn Trả Hôm Nay', value: '12', change: 'Cần tiếp nhận', icon: '⏰', colorClass: 'amber' },
    { title: 'Sách Quá Hạn Cần Gọi Độc Giả', value: '5', change: 'Trễ hạn > 3 ngày', icon: '⚠️', colorClass: 'red' },
    { title: 'Độc Giả Đến Quầy', value: '26', change: 'Lượt tiếp đón', icon: '👥', colorClass: 'blue' }
  ];

  public urgentSlips = [
    { id: 'PM-8012', patron: 'Nguyễn Hải Nam', book: 'Lập trình Microservices', dueDate: 'Hôm nay 17:00', phone: '0912.345.678' },
    { id: 'PM-8009', patron: 'Vũ Thị Phương', book: 'Domain-Driven Design', dueDate: 'Hôm nay 11:30', phone: '0988.765.432' },
    { id: 'PM-7994', patron: 'Đặng Tuấn Anh', book: 'Spring Security In Action', dueDate: 'Quá hạn 1 ngày', phone: '0903.112.233' }
  ];
}
