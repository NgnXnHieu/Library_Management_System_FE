import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * COMPONENT PHÂN TRANG DÙNG CHUNG (REUSABLE PAGINATION COMPONENT)
 * - Tái sử dụng cho mọi màn hình danh sách trong toàn bộ hệ thống.
 * - Hỗ trợ nhảy trang trực tiếp, nút Trước/Sau, Trang đầu/Trang cuối, và chọn số dòng trên mỗi trang.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {

  /**
   * Chỉ số trang hiện tại (0-indexed theo chuẩn Spring Data JPA Page)
   */
  @Input() currentPage: number = 0;

  /**
   * Số lượng bản ghi trên một trang (mặc định 10)
   */
  @Input() pageSize: number = 10;

  /**
   * Tổng số lượng bản ghi trong toàn hệ thống
   */
  @Input() totalElements: number = 0;

  /**
   * Tổng số trang có thể hiển thị
   */
  @Input() totalPages: number = 0;

  /**
   * Danh sách tùy chọn số bản ghi mỗi trang cho người dùng chọn
   */
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];

  /**
   * Sự kiện phát ra khi người dùng chuyển sang trang khác (trả về index trang mới 0-indexed)
   */
  @Output() pageChange = new EventEmitter<number>();

  /**
   * Sự kiện phát ra khi người dùng thay đổi kích thước trang
   */
  @Output() pageSizeChange = new EventEmitter<number>();

  /**
   * Tính toán vị trí bản ghi đầu tiên hiển thị trên trang hiện tại (1-indexed phục vụ hiển thị)
   */
  get startIndex(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  /**
   * Tính toán vị trí bản ghi cuối cùng hiển thị trên trang hiện tại
   */
  get endIndex(): number {
    if (this.totalElements === 0) return 0;
    const computedEnd = (this.currentPage + 1) * this.pageSize;
    return computedEnd > this.totalElements ? this.totalElements : computedEnd;
  }

  /**
   * Tạo danh sách số trang thông minh hiển thị các nút bấm (1-indexed để người dùng dễ đọc)
   * Có hỗ trợ dấu ba chấm '...' khi số trang quá lớn
   */
  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage + 1; // 1-indexed cho hiển thị
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Luôn có trang 1
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Luôn có trang cuối cùng
    pages.push(total);

    return pages;
  }

  /**
   * Xử lý chuyển trang
   * @param page Số trang người dùng bấm vào (0-indexed)
   */
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  /**
   * Xử lý khi bấm nút số trang từ mảng visiblePages (1-indexed)
   */
  onPageClick(p: number | string): void {
    if (typeof p === 'number') {
      this.goToPage(p - 1);
    }
  }

  /**
   * Xử lý khi thay đổi kích thước trang (size)
   */
  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(Number(newSize));
  }
}
