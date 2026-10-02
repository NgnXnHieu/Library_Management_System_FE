import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CustomerHeaderComponent } from './components/customer-header/customer-header.component';

/**
 * LAYOUT PHÍA KHÁCH HÀNG (CUSTOMER PORTAL LAYOUT)
 * Cung cấp khung giao diện có Header cố định ở trên và thanh tìm kiếm,
 * bọc các trang dành cho khách hàng như: Trang chủ, Thể loại, Phiếu mượn của tôi...
 */
@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CustomerHeaderComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {}
