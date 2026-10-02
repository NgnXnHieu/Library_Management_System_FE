import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * THANH TOPBAR PHÍA TRÊN CHO GIAO DIỆN QUẢN TRỊ CỬA HÀNG
 * Hiển thị thông tin nhanh: Ngày làm việc, thông báo, chi nhánh, tên nhân viên.
 */
@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {
  public authService = inject(AuthService);

  // Ngày làm việc hiện tại
  public currentDate: Date = new Date();
}
