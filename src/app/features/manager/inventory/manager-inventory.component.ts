import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

/**
 * MÀN HÌNH QUẢN LÝ KHO SÁCH CHO QUẢN LÝ CHI NHÁNH (BRANCH MANAGER)
 * Có đầy đủ quyền quản lý sách trong phạm vi chi nhánh:
 * Nhập thêm sách từ nhà xuất bản về chi nhánh, Thanh lý sách rách hỏng, Kiểm kê định kỳ.
 */
@Component({
  selector: 'app-manager-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-inventory.component.html',
  styleUrl: './manager-inventory.component.css'
})
export class ManagerInventoryComponent {
  public authService = inject(AuthService);

  get user(): User | null {
    return this.authService.currentUser();
  }

  public keyword: string = '';

  public inventoryList = [
    { code: 'BK-1001', title: 'Clean Code - Mã Sạch', author: 'Robert C. Martin', total: 10, borrowed: 6, stock: 4, condition: 'Tốt (100%)' },
    { code: 'BK-1002', title: 'Spring Boot In Action', author: 'Craig Walls', total: 5, borrowed: 3, stock: 2, condition: 'Tốt (95%)' },
    { code: 'BK-1003', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', total: 6, borrowed: 6, stock: 0, condition: '1 bản sờn gáy' },
    { code: 'BK-1004', title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', total: 15, borrowed: 8, stock: 7, condition: 'Tốt (100%)' }
  ];

  get filteredList() {
    if (!this.keyword.trim()) return this.inventoryList;
    const kw = this.keyword.toLowerCase();
    return this.inventoryList.filter(item => item.title.toLowerCase().includes(kw) || item.code.toLowerCase().includes(kw));
  }
}
