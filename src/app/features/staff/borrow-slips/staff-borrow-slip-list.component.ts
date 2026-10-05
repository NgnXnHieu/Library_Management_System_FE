import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StaffBorrowSlipService } from './services/staff-borrow-slip.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { 
  BorrowSlipFilterParams, 
  BorrowSlipResponseDto, 
  BorrowStatus, 
  PaymentStatus,
  isBorrowSlipOverdue,
  getBorrowSlipOverdueDays,
  getBorrowSlipStatusLabel,
  getBorrowSlipStatusBadgeClass
} from '../../../shared/models/borrow-slip.model';
import { environment } from '../../../../environments/environment';

/**
 * MÀN HÌNH QUẢN LÝ PHIẾU MƯỢN SÁCH PHÍA NHÂN VIÊN QUẦY (STAFF)
 * - Tra cứu và hiển thị danh sách phiếu mượn của chi nhánh làm việc (GET /borrow-slips/current-branch).
 * - Bảng danh sách phiếu mượn với bộ lọc đa tiêu chí: Mã phiếu, Độc giả (tên/SĐT/email), Trạng thái mượn, Trạng thái thanh toán, Khoảng ngày mượn, Sắp xếp.
 * - Mỗi dòng gồm nút:
 *   + "Xem chi tiết": Mở modal hiển thị chi tiết phiếu mượn và danh sách sách mượn bên trong (BorrowItem).
 *   + "Cập nhật trạng thái": Mở modal cập nhật trạng thái phiếu mượn (RETURNED - Đã trả, OVERDUE - Quá hạn, CANCELLED - Hủy phiếu) (PUT /borrow-slips/{id}/status).
 */
@Component({
  selector: 'app-staff-borrow-slip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './staff-borrow-slip-list.component.html',
  styleUrl: './staff-borrow-slip-list.component.css'
})
export class StaffBorrowSlipListComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private borrowSlipService = inject(StaffBorrowSlipService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // Dữ liệu danh sách phiếu mượn và phân trang
  public borrowSlips: BorrowSlipResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Bộ lọc tìm kiếm
  public filterParams: {
    borrowCode: string;
    customerSearch: string;
    status?: BorrowStatus;
    paymentStatus?: PaymentStatus;
    fromBorrowedDate: string;
    toBorrowedDate: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
  } = {
    borrowCode: '',
    customerSearch: '',
    status: undefined,
    paymentStatus: undefined,
    fromBorrowedDate: '',
    toBorrowedDate: '',
    sortBy: 'borrowedAt',
    sortDir: 'desc'
  };

  // State modal xem chi tiết
  public selectedSlipForDetail: BorrowSlipResponseDto | null = null;

  // State modal cập nhật trạng thái
  public selectedSlipForStatusUpdate: BorrowSlipResponseDto | null = null;
  public newStatus: BorrowStatus = 'RETURNED';
  public isSubmittingStatus: boolean = false;

  ngOnInit(): void {
    // Bước 1: Đọc tham số tìm kiếm độc giả nếu được chuyển từ trang Hồ sơ khách hàng sang
    this.route.queryParams.subscribe(params => {
      if (params['customerSearch']) {
        this.filterParams.customerSearch = params['customerSearch'];
      }
      // Bước 2: Nạp danh sách phiếu mượn của chi nhánh
      this.loadBorrowSlips();
    });
  }

  /**
   * Tải danh sách phiếu mượn chi nhánh theo bộ lọc và phân trang
   */
  loadBorrowSlips(): void {
    this.isLoading = true;

    // Chuẩn bị tham số gửi sang service
    const params: BorrowSlipFilterParams = {
      page: this.currentPage,
      size: this.pageSize,
      borrowCode: this.filterParams.borrowCode.trim() || undefined,
      customerSearch: this.filterParams.customerSearch.trim() || undefined,
      status: this.filterParams.status || undefined,
      paymentStatus: this.filterParams.paymentStatus || undefined,
      sortBy: this.filterParams.sortBy,
      sortDir: this.filterParams.sortDir
    };

    // Format ngày giờ ISO-8601 nếu người dùng chọn ngày
    if (this.filterParams.fromBorrowedDate) {
      params.fromBorrowedAt = `${this.filterParams.fromBorrowedDate}T00:00:00`;
    }
    if (this.filterParams.toBorrowedDate) {
      params.toBorrowedAt = `${this.filterParams.toBorrowedDate}T23:59:59`;
    }

    this.borrowSlipService.getMyBranchBorrowSlips(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.borrowSlips = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Không thể tải danh sách phiếu mượn chi nhánh!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xử lý khi bấm nút "Tìm kiếm" / "Lọc"
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadBorrowSlips();
  }

  /**
   * Đặt lại toàn bộ bộ lọc về mặc định
   */
  onResetFilter(): void {
    this.filterParams = {
      borrowCode: '',
      customerSearch: '',
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
   * Xử lý đổi trang phân trang
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBorrowSlips();
  }

  /**
   * Xử lý thay đổi kích thước trang
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadBorrowSlips();
  }

  // =========================================================================
  // XỬ LÝ MODAL XEM CHI TIẾT PHIẾU MƯỢN
  // =========================================================================

  /**
   * Mở modal xem thông tin chi tiết và danh sách borrowItems bên trong
   */
  openDetailModal(slip: BorrowSlipResponseDto): void {
    this.selectedSlipForDetail = slip;
  }

  /**
   * Đóng modal xem chi tiết
   */
  closeDetailModal(): void {
    this.selectedSlipForDetail = null;
  }

  // =========================================================================
  // XỬ LÝ MODAL CẬP NHẬT TRẠNG THÁI PHIẾU MƯỢN
  // =========================================================================

  /**
   * Mở modal cập nhật trạng thái
   */
  openStatusModal(slip: BorrowSlipResponseDto): void {
    this.selectedSlipForStatusUpdate = slip;
    this.newStatus = slip.status;
  }

  /**
   * Đóng modal cập nhật trạng thái
   */
  closeStatusModal(): void {
    this.selectedSlipForStatusUpdate = null;
    this.isSubmittingStatus = false;
  }

  /**
   * Chuyển từ Modal xem chi tiết sang Modal cập nhật trạng thái
   */
  openStatusModalFromDetail(): void {
    if (this.selectedSlipForDetail) {
      const slip = this.selectedSlipForDetail;
      this.closeDetailModal();
      this.openStatusModal(slip);
    }
  }

  /**
   * Xác nhận gọi API cập nhật trạng thái phiếu mượn tại chi nhánh
   */
  confirmUpdateStatus(): void {
    if (!this.selectedSlipForStatusUpdate) return;

    if (this.newStatus === this.selectedSlipForStatusUpdate.status) {
      this.toastService.warning('Trạng thái mới trùng với trạng thái hiện tại!');
      return;
    }

    this.isSubmittingStatus = true;
    const slipId = this.selectedSlipForStatusUpdate.id;

    this.borrowSlipService.updateStatus(slipId, this.newStatus).subscribe({
      next: (res) => {
        this.isSubmittingStatus = false;
        this.toastService.success(res.message || 'Cập nhật trạng thái phiếu mượn thành công!');
        this.closeStatusModal();
        this.loadBorrowSlips();
      },
      error: (err) => {
        this.isSubmittingStatus = false;
        const msg = err.error?.message || 'Cập nhật trạng thái thất bại!';
        this.toastService.error(msg);
      }
    });
  }

  // =========================================================================
  // XỬ LÝ HÌNH ẢNH BÌA SÁCH TRONG MODAL CHI TIẾT
  // =========================================================================

  getImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const host = this.baseUrl.replace(/\/api\/?$/, '');
    if (url.startsWith('/')) {
      return `${host}${url}`;
    }
    return `${host}/api/uploads/${url}`;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }

  // =========================================================================
  // CÁC HÀM TIỆN ÍCH HIỂN THỊ BADGE VÀ NHÃN (LABELS)
  // =========================================================================

  isOverdue(slip: BorrowSlipResponseDto | null | undefined): boolean {
    return isBorrowSlipOverdue(slip);
  }

  getOverdueDays(slip: BorrowSlipResponseDto | null | undefined): number {
    return getBorrowSlipOverdueDays(slip);
  }

  getStatusBadgeClass(slipOrStatus: BorrowSlipResponseDto | BorrowStatus): string {
    if (typeof slipOrStatus === 'object' && slipOrStatus !== null) {
      return getBorrowSlipStatusBadgeClass(slipOrStatus);
    }
    switch (slipOrStatus) {
      case 'BORROWED': return 'badge-borrowed';
      case 'RETURNED': return 'badge-returned';
      case 'OVERDUE': return 'badge-overdue';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-default';
    }
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

  getPaymentStatusBadgeClass(paymentStatus: PaymentStatus): string {
    switch (paymentStatus) {
      case 'PAID': return 'badge-paid';
      case 'UNPAID': return 'badge-unpaid';
      case 'REFUNDED': return 'badge-refunded';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-default';
    }
  }

  getPaymentStatusLabel(paymentStatus: PaymentStatus): string {
    switch (paymentStatus) {
      case 'PAID': return 'Đã thanh toán';
      case 'UNPAID': return 'Chưa thanh toán';
      case 'REFUNDED': return 'Đã hoàn tiền';
      case 'CANCELLED': return 'Đã hủy';
      default: return paymentStatus;
    }
  }
}
