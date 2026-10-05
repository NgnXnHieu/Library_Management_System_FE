import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BorrowSlipService } from '../../borrow-slips/services/borrow-slip.service';
import { 
  BorrowSlipFilterParams, 
  BorrowSlipResponseDto, 
  BorrowStatus, 
  PaymentStatus,
  isBorrowSlipOverdue,
  getBorrowSlipOverdueDays
} from '../../../shared/models/borrow-slip.model';

/**
 * COMPONENT: Quản lý và hiển thị danh sách phiếu mượn cá nhân của độc giả.
 * Gọi API GET /borrow-slips/my-slips để lấy các phiếu mượn thuộc tài khoản hiện tại.
 */
@Component({
  selector: 'app-customer-borrow-slip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-borrow-slip-list.component.html',
  styleUrl: './customer-borrow-slip-list.component.css'
})
export class CustomerBorrowSlipListComponent implements OnInit {

  private readonly borrowSlipService = inject(BorrowSlipService);

  // Danh sách phiếu mượn cá nhân
  public borrowSlips: BorrowSlipResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public isLoading: boolean = false;
  public errorMessage: string = '';

  // Bộ lọc tìm kiếm, trạng thái và phân trang
  public filter: BorrowSlipFilterParams = {
    page: 0,
    size: 10,
    borrowCode: '',
    status: undefined,
    paymentStatus: undefined,
    sortBy: 'borrowedAt',
    sortDir: 'desc'
  };

  // State mở rộng/thu gọn chi tiết sách của từng phiếu mượn (mặc định mở tất cả)
  public expandedSlips: { [slipId: number]: boolean } = {};

  ngOnInit(): void {
    this.loadMyBorrowSlips();
  }

  /**
   * Gọi API Backend lấy danh sách phiếu mượn của tài khoản hiện tại.
   */
  loadMyBorrowSlips(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.borrowSlipService.getMyBorrowSlips(this.filter).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.borrowSlips = response.data.content || [];
          this.totalElements = response.data.totalElements || 0;
          this.totalPages = response.data.totalPages || 0;

          // Mặc định mở rộng chi tiết sách (borrowItems) cho tất cả các phiếu mượn
          this.borrowSlips.forEach(slip => {
            if (this.expandedSlips[slip.id] === undefined) {
              this.expandedSlips[slip.id] = true;
            }
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Không thể tải danh sách phiếu mượn. Vui lòng thử lại sau!';
        console.error('[CustomerBorrowSlipListComponent] Lỗi lấy danh sách phiếu mượn:', error);
      }
    });
  }

  /**
   * Đổi trạng thái mở/đóng xem chi tiết sách của 1 phiếu mượn
   */
  toggleItems(slipId: number): void {
    this.expandedSlips[slipId] = !this.expandedSlips[slipId];
  }

  /**
   * Xử lý tìm kiếm hoặc thay đổi bộ lọc
   */
  onFilterChange(): void {
    this.filter.page = 0;
    this.loadMyBorrowSlips();
  }

  /**
   * Đặt lại bộ lọc về mặc định
   */
  onResetFilter(): void {
    this.filter = {
      page: 0,
      size: 10,
      borrowCode: '',
      status: undefined,
      paymentStatus: undefined,
      sortBy: 'borrowedAt',
      sortDir: 'desc'
    };
    this.loadMyBorrowSlips();
  }

  /**
   * Chuyển trang
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.filter.page) {
      this.filter.page = page;
      this.loadMyBorrowSlips();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Tạo mảng số trang để render pagination
   */
  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const currentPage = this.filter.page || 0;

    let start = Math.max(0, currentPage - 2);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Kiểm tra quá hạn
   */
  isOverdue(slip: BorrowSlipResponseDto | null | undefined): boolean {
    return isBorrowSlipOverdue(slip);
  }

  /**
   * Tính số ngày quá hạn làm tròn lên 1 ngày
   */
  getOverdueDays(slip: BorrowSlipResponseDto | null | undefined): number {
    return getBorrowSlipOverdueDays(slip);
  }

  /**
   * Lấy class CSS huy hiệu trạng thái phiếu mượn
   */
  getStatusBadgeClass(slipOrStatus: BorrowSlipResponseDto | BorrowStatus): string {
    if (typeof slipOrStatus === 'object' && slipOrStatus !== null) {
      if (this.isOverdue(slipOrStatus)) {
        return 'badge-overdue';
      }
      slipOrStatus = slipOrStatus.status;
    }
    switch (slipOrStatus) {
      case 'BORROWED':
        return 'badge-borrowed';
      case 'RETURNED':
        return 'badge-returned';
      case 'OVERDUE':
        return 'badge-overdue';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-default';
    }
  }

  /**
   * Nhãn tiếng Việt trạng thái phiếu mượn
   */
  getStatusLabel(slipOrStatus: BorrowSlipResponseDto | BorrowStatus): string {
    if (typeof slipOrStatus === 'object' && slipOrStatus !== null) {
      if (this.isOverdue(slipOrStatus)) {
        return '⚠️ Quá hạn trả';
      }
      slipOrStatus = slipOrStatus.status;
    }
    switch (slipOrStatus) {
      case 'BORROWED':
        return '📖 Đang mượn';
      case 'RETURNED':
        return '✅ Đã trả sách';
      case 'OVERDUE':
        return '⚠️ Quá hạn trả';
      case 'CANCELLED':
        return '⛔ Đã hủy';
      default:
        return slipOrStatus;
    }
  }

  /**
   * Lấy class CSS huy hiệu trạng thái thanh toán
   */
  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case 'PAID':
        return 'badge-paid';
      case 'UNPAID':
        return 'badge-unpaid';
      case 'REFUNDED':
        return 'badge-refunded';
      case 'CANCELLED':
        return 'badge-cancelled';
      default:
        return 'badge-default';
    }
  }

  /**
   * Nhãn tiếng Việt trạng thái thanh toán
   */
  getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'PAID':
        return '💳 Đã thanh toán';
      case 'UNPAID':
        return '⏳ Chưa thanh toán';
      case 'REFUNDED':
        return '↩️ Đã hoàn tiền';
      case 'CANCELLED':
        return '❌ Đã hủy';
      default:
        return status;
    }
  }
}
