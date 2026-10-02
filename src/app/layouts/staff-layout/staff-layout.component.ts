import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { StaffSidebarComponent } from './components/staff-sidebar/staff-sidebar.component';
import { AdminHeaderComponent } from '../admin-layout/components/admin-header/admin-header.component';

/**
 * LAYOUT PHÂN HỆ NHÂN VIÊN QUẦY (STAFF LAYOUT)
 * Sử dụng StaffSidebarComponent riêng biệt.
 */
@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, StaffSidebarComponent, AdminHeaderComponent],
  templateUrl: './staff-layout.component.html',
  styleUrl: './staff-layout.component.css'
})
export class StaffLayoutComponent {}
