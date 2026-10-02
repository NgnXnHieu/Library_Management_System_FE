import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';

/**
 * LAYOUT PHÍA CỬA HÀNG / QUẢN TRỊ (ADMIN & STORE MANAGEMENT LAYOUT)
 * Bỏ thanh Menu bar trên cùng, thay bằng Navbar phía bên trái (Sidebar)
 * và chia thành 2 cột: Cột trái (Sidebar cố định) + Cột phải (Nội dung thao tác).
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent, AdminHeaderComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {}
