import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BorrowSlipService } from '../services/borrow-slip.service';
import { BorrowSlipFilterParams, BorrowSlipResponseDto, BorrowStatus } from '../../../shared/models/borrow-slip.model';

/**
 * TẦNG COMPONENT: Chịu trách nhiệm hiển thị giao diện danh sách phiếu mượn.
 * Chỉ nhận sự kiện người dùng và gọi xuống tầng Service để lấy dữ liệu.
 */
@Component({
  selector: 'app-borrow-slip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './borrow-slip-list.component.html',
  styleUrl: './borrow-slip-list.component.css'
})
export class BorrowSlipListComponent implements OnInit {

  // Inject Service xử lý nghiệp vụ
  private borrowSlipService = inject(BorrowSlipService);

  // Biến lưu trữ dữ liệu trả về từ backend
  public borrowSlips: BorrowSlipResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public isLoading: boolean = false;
  public errorMessage: string = '';

  // Bộ lọc tìm kiếm và phân trang
  public filter: BorrowSlipFilterParams = {
    page: 0,
    size: 10,
    keyword: '',
    status: undefined
  };

  /**
   * Khởi chạy khi Component được nạp lên trình duyệt.
   */
  ngOnInit(): void {
    this.loadBorrowSlips();
  }

  /**
   * Gọi xuống tầng Service để tải danh sách phiếu mượn từ Spring Boot Backend.
   */
  loadBorrowSlips(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Gọi Service lấy dữ liệu
    this.borrowSlipService.getAllBorrowSlips(this.filter).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.borrowSlips = response.data.content;
          this.totalElements = response.data.totalElements;
          this.totalPages = response.data.totalPages;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Không thể tải danh sách phiếu mượn!';
        console.error('[BorrowSlipListComponent] Lỗi gọi API:', error);
      }
    });
  }

  /**
   * Xử lý khi người dùng bấm nút Tìm kiếm
   */
  onSearch(): void {
    this.filter.page = 0; // Quay về trang đầu tiên
    this.loadBorrowSlips();
  }

  /**
   * Xử lý chuyển trang trước/sau
   */
  onPageChange(newPage: number): void {
    if (newPage >= 0 && newPage < this.totalPages) {
      this.filter.page = newPage;
      this.loadBorrowSlips();
    }
  }

  /**
   * Hàm tiện ích trả về class CSS hiển thị màu sắc theo trạng thái mượn
   */
  getStatusBadgeClass(status: BorrowStatus): string {
    switch (status) {
      case 'BORROWED': return 'badge-info';
      case 'RETURNED': return 'badge-success';
      case 'OVERDUE': return 'badge-danger';
      default: return 'badge-warning';
    }
  }

  /**
   * Hàm dịch trạng thái sang tiếng Việt thân thiện
   */
  getStatusLabel(status: BorrowStatus): string {
    switch (status) {
      case 'BORROWED': return 'Đang mượn';
      case 'RETURNED': return 'Đã trả';
      case 'OVERDUE': return 'Quá hạn';
      default: return status;
    }
  }
}
