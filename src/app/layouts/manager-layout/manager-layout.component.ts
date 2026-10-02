import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ManagerSidebarComponent } from './components/manager-sidebar/manager-sidebar.component';
import { AdminHeaderComponent } from '../admin-layout/components/admin-header/admin-header.component';

/**
 * LAYOUT PHÂN HỆ QUẢN LÝ CHI NHÁNH (BRANCH MANAGER LAYOUT)
 * Sử dụng ManagerSidebarComponent riêng biệt.
 */
@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ManagerSidebarComponent, AdminHeaderComponent],
  templateUrl: './manager-layout.component.html',
  styleUrl: './manager-layout.component.css'
})
export class ManagerLayoutComponent {}
