import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminBorrowSlipService } from '../../admin/borrow-slips/services/admin-borrow-slip.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { 
  BorrowSlipResponseDto, 
  BorrowStatus, 
  PaymentStatus,
  isBorrowSlipOverdue,
  getBorrowSlipOverdueDays,
  getBorrowSlipStatusLabel,
  getBorrowSlipStatusBadgeClass
} from '../../../shared/models/borrow-slip.model';

/**
 * MÀN HÌNH XEM DANH SÁCH PHIẾU MƯỢN CỦA KHÁCH HÀNG (CUSTOMER BORROW SLIPS)
 * Dùng chung cho cả Admin (/admin/customers/:id/borrow-slips) và Staff (/staff/patrons/:id/borrow-slips)
 * - Tự động nhận diện ngữ cảnh điều hướng quay lại.
 * - Hiển thị card tóm tắt thông tin khách hàng đang xem.
 * - Gọi API GET /admin/borrow-slips với customerId để lấy toàn bộ lịch sử phiếu mượn của khách hàng này.
 * - Bộ lọc đa dạng: mã phiếu, trạng thái mượn, trạng thái thanh toán, khoảng ngày mượn.
 * - Sắp xếp theo ngày mượn, hạn trả, ngày trả, tổng tiền.
 * - Modal xem chi tiết các cuốn sách trong phiếu mượn.
 */
@Component({
  selector: 'app-customer-borrow-slips',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './customer-borrow-slips.component.html',
  styleUrl: './customer-borrow-slips.component.css'
})
export class CustomerBorrowSlipsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private borrowSlipService = inject(AdminBorrowSlipService);
  private toastService = inject(ToastService);

  // Ngữ cảnh vai trò: Admin hay Staff
  public isAdminContext: boolean = false;

  // Thông tin khách hàng
  public customerId: number = 0;
  public customerInfo = {
    fullName: '',
    username: '',
    phone: '',
    email: ''
  };

  // Dữ liệu danh sách phiếu mượn & phân trang
  public borrowSlips: BorrowSlipResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Bộ lọc tìm kiếm và sắp xếp
  public filterParams: {
    borrowCode: string;
    status?: BorrowStatus;
    paymentStatus?: PaymentStatus;
    fromBorrowedDate: string;
    toBorrowedDate: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  } = {
    borrowCode: '',
    status: undefined,
    paymentStatus: undefined,
    fromBorrowedDate: '',
    toBorrowedDate: '',
    sortBy: 'borrowedAt',
    sortDir: 'desc'
  };

  // Modal xem chi tiết phiếu mượn
  public selectedSlipForDetail: BorrowSlipResponseDto | null = null;

  ngOnInit(): void {
    // Bước 1: Xác định ngữ cảnh điều hướng (Admin hay Staff)
    const currentUrl = this.router.url;
    this.isAdminContext = currentUrl.startsWith('/admin');

    // Bước 2: Lấy customerId từ route params
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.customerId = Number(idParam);
    }

    // Bước 3: Đọc thông tin tóm tắt khách hàng từ queryParams (nếu có)
    this.route.queryParams.subscribe(params => {
      this.customerInfo = {
        fullName: params['name'] || '',
        username: params['username'] || '',
        phone: params['phone'] || '',
        email: params['email'] || ''
      };
    });

    // Bước 4: Tải danh sách phiếu mượn của khách hàng này
    if (this.customerId > 0) {
      this.loadBorrowSlips();
    } else {
      this.toastService.error('Không tìm thấy thông tin mã khách hàng hợp lệ!');
    }
  }

  /**
   * Gọi API lấy danh sách phiếu mượn phân trang của khách hàng
   */
  loadBorrowSlips(): void {
    this.isLoading = true;

    // Chuyển đổi định dạng ngày lọc (nếu có) sang ISO format đầu/cuối ngày
    let fromIso: string | undefined = undefined;
    let toIso: string | undefined = undefined;
    if (this.filterParams.fromBorrowedDate) {
      fromIso = `${this.filterParams.fromBorrowedDate}T00:00:00`;
    }
    if (this.filterParams.toBorrowedDate) {
      toIso = `${this.filterParams.toBorrowedDate}T23:59:59`;
    }

    this.borrowSlipService.getBorrowSlips({
      page: this.currentPage,
      size: this.pageSize,
      customerId: this.customerId,
      borrowCode: this.filterParams.borrowCode.trim() || undefined,
      status: this.filterParams.status || undefined,
      paymentStatus: this.filterParams.paymentStatus || undefined,
      fromBorrowedAt: fromIso,
      toBorrowedAt: toIso,
      sortBy: this.filterParams.sortBy,
      sortDir: this.filterParams.sortDir
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.borrowSlips = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        } else {
          this.borrowSlips = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Không thể tải danh sách phiếu mượn của khách hàng!');
      }
    });
  }

  /**
   * Áp dụng bộ lọc tìm kiếm
   */
  onApplyFilter(): void {
    this.currentPage = 0;
    this.loadBorrowSlips();
  }

  /**
   * Đặt lại bộ lọc về mặc định
   */
  onResetFilter(): void {
    this.filterParams = {
      borrowCode: '',
      status: undefined,
      paymentStatus: undefined,
      fromBorrowedDate: '',
      toBorrowedDate: '',
      sortBy: 'borrowedAt',
      sortDir: 'desc'
    };
    this.currentPage = 0;
    this.loadBorrowSlips();
  }

  /**
   * Đổi trang
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBorrowSlips();
  }

  /**
   * Đổi kích thước trang
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadBorrowSlips();
  }

  /**
   * Quay lại danh sách khách hàng
   */
  goBack(): void {
    if (this.isAdminContext) {
      this.router.navigate(['/admin/customers']);
    } else {
      this.router.navigate(['/staff/patrons']);
    }
  }

  // =========================================================================
  // MODAL CHI TIẾT SÁCH MƯỢN
  // =========================================================================

  openDetailModal(slip: BorrowSlipResponseDto): void {
    this.selectedSlipForDetail = slip;
  }

  closeDetailModal(): void {
    this.selectedSlipForDetail = null;
  }

  // =========================================================================
  // HELPER FORMAT & BADGE
  // =========================================================================

  isOverdue(slip: BorrowSlipResponseDto | null | undefined): boolean {
    return isBorrowSlipOverdue(slip);
  }

  getOverdueDays(slip: BorrowSlipResponseDto | null | undefined): number {
    return getBorrowSlipOverdueDays(slip);
  }

  getStatusLabel(slipOrStatus: BorrowSlipResponseDto | BorrowStatus): string {
    if (typeof slipOrStatus === 'object' && slipOrStatus !== null) {
      return getBorrowSlipStatusLabel(slipOrStatus);
    }
    switch (slipOrStatus) {
      case 'BORROWED': return 'Đang mượn';
      case 'RETURNED': return 'Đã trả';
      case 'OVERDUE': return 'Quá hạn';
      case 'CANCELLED': return 'Đã hủy';
      default: return slipOrStatus;
    }
  }

  getStatusClass(slipOrStatus: BorrowSlipResponseDto | BorrowStatus): string {
    if (typeof slipOrStatus === 'object' && slipOrStatus !== null) {
      return getBorrowSlipStatusBadgeClass(slipOrStatus);
    }
    switch (slipOrStatus) {
      case 'BORROWED': return 'badge-borrowed';
      case 'RETURNED': return 'badge-returned';
      case 'OVERDUE': return 'badge-overdue';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  }

  getPaymentLabel(payment: PaymentStatus): string {
    switch (payment) {
      case 'PAID': return 'Đã thanh toán';
      case 'UNPAID': return 'Chưa thanh toán';
      case 'REFUNDED': return 'Đã hoàn tiền';
      case 'CANCELLED': return 'Đã hủy';
      default: return payment;
    }
  }

  getPaymentClass(payment: PaymentStatus): string {
    switch (payment) {
      case 'PAID': return 'badge-paid';
      case 'UNPAID': return 'badge-unpaid';
      case 'REFUNDED': return 'badge-refunded';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  }
}
