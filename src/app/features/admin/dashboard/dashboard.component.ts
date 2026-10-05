import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../branches/services/branch.service';
import { BranchStatisticResponseDto } from '../../../shared/models/branch.model';
import { environment } from '../../../../environments/environment';

/**
 * BÁO CÁO TỔNG HỢP CHI NHÁNH TOÀN HỆ THỐNG (SUPER ADMIN)
 * Hiển thị các chỉ số tổng hợp và bảng thống kê chi tiết từng chi nhánh:
 * tồn kho, sách khả dụng, sách đang mượn, lượt mượn và doanh thu theo mốc thời gian lọc.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private branchService = inject(BranchService);
  private baseUrl = environment.apiUrl;

  // Danh sách dữ liệu thống kê chi nhánh từ API
  public branchStatistics = signal<BranchStatisticResponseDto[]>([]);
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  // Bộ lọc tìm kiếm và phân trang
  public searchKeyword: string = '';
  public selectedStatus: string = '';
  public page: number = 0;
  public size: number = 10;
  public totalElements: number = 0;
  public totalPages: number = 0;

  // Bộ lọc thời gian (Mặc định: 'today')
  public timePreset: 'today' | 'week' | 'month' | 'custom' = 'today';
  public customStartDate: string = '';
  public customEndDate: string = '';
  public currentTimeRangeDescription: string = 'Hôm nay';

  // Thống kê nhanh tổng hợp (KPI)
  public kpiTotalBranches: number = 0;
  public kpiOpenBranches: number = 0;
  public kpiTotalBooks: number = 0;
  public kpiTotalAvailable: number = 0;
  public kpiTotalBorrowed: number = 0;
  public kpiTotalBorrowSlips: number = 0;
  public kpiTotalRevenue: number = 0;

  ngOnInit(): void {
    const todayStr = this.formatDateOnly(new Date());
    this.customStartDate = todayStr;
    this.customEndDate = todayStr;
    this.loadStatistics();
  }

  /**
   * Chuyển đổi đường dẫn ảnh thành URL hoàn chỉnh để hiển thị trên trình duyệt
   */
  public getImageUrl(url?: string | null): string {
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

  /**
   * Gọi API GET /admin/branches/statistics lấy danh sách phân trang dữ liệu thống kê
   */
  public loadStatistics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Tính toán mốc thời gian bắt đầu và kết thúc
    const dateRange = this.getDateRangeForPreset(this.timePreset);

    const filter = {
      name: this.searchKeyword.trim() ? this.searchKeyword.trim() : undefined,
      status: this.selectedStatus ? this.selectedStatus : undefined,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      page: this.page,
      size: this.size,
      sortBy: 'createdAt',
      sortDir: 'desc'
    };

    this.branchService.getBranchStatistics(filter).subscribe({
      next: (response) => {
        if (response.data) {
          const content = response.data.content || [];
          this.branchStatistics.set(content);
          this.totalElements = response.data.totalElements || 0;
          this.totalPages = response.data.totalPages || 0;

          // Tính toán các chỉ số KPI tổng hợp từ dữ liệu hiện tại
          this.calculateKpiMetrics(content, this.totalElements);
        } else {
          this.branchStatistics.set([]);
          this.totalElements = 0;
          this.totalPages = 0;
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu thống kê chi nhánh:', err);
        this.errorMessage.set(err?.error?.message || 'Không thể tải báo cáo thống kê chi nhánh. Vui lòng thử lại!');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Thay đổi lựa chọn mốc thời gian (Hôm nay, Tuần này, Tháng này, Tùy chọn)
   */
  public onTimePresetChange(preset: 'today' | 'week' | 'month' | 'custom'): void {
    this.timePreset = preset;
    if (preset !== 'custom') {
      this.page = 0;
      this.loadStatistics();
    }
  }

  /**
   * Áp dụng khoảng thời gian tùy chọn khi người dùng bấm nút Áp Dụng
   */
  public onApplyCustomTimeFilter(): void {
    if (!this.customStartDate || !this.customEndDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc!');
      return;
    }
    if (this.customStartDate > this.customEndDate) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }
    this.page = 0;
    this.loadStatistics();
  }

  /**
   * Tìm kiếm theo từ khóa (Mã hoặc Tên chi nhánh)
   */
  public onSearch(): void {
    this.page = 0;
    this.loadStatistics();
  }

  /**
   * Lọc theo trạng thái chi nhánh (Tất cả, Đang mở cửa, Đóng cửa)
   */
  public onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.page = 0;
    this.loadStatistics();
  }

  /**
   * Xóa toàn bộ bộ lọc và đặt lại mặc định (Hôm nay)
   */
  public onResetFilter(): void {
    this.searchKeyword = '';
    this.selectedStatus = '';
    this.timePreset = 'today';
    const todayStr = this.formatDateOnly(new Date());
    this.customStartDate = todayStr;
    this.customEndDate = todayStr;
    this.page = 0;
    this.loadStatistics();
  }

  /**
   * Chuyển sang trang khác
   */
  public goToPage(targetPage: number): void {
    if (targetPage >= 0 && targetPage < this.totalPages && targetPage !== this.page) {
      this.page = targetPage;
      this.loadStatistics();
    }
  }

  /**
   * Thay đổi số lượng dòng hiển thị trên mỗi trang
   */
  public onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.size = Number(select.value);
    this.page = 0;
    this.loadStatistics();
  }

  /**
   * Helper Math.min sử dụng trong template
   */
  public mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  /**
   * Tạo danh sách số trang phục vụ hiển thị thanh phân trang
   */
  public getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Tính toán khoảng thời gian fromDate và toDate tương ứng với preset
   */
  private getDateRangeForPreset(preset: 'today' | 'week' | 'month' | 'custom'): { fromDate?: string; toDate?: string } {
    const now = new Date();

    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      this.currentTimeRangeDescription = `Hôm nay (${this.formatDisplayDate(now)})`;
      return {
        fromDate: this.formatLocalDateTime(start),
        toDate: this.formatLocalDateTime(end)
      };
    }

    if (preset === 'week') {
      const dayOfWeek = now.getDay(); // 0: CN, 1: T2, ..., 6: T7
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59);
      this.currentTimeRangeDescription = `Tuần này (${this.formatDisplayDate(monday)} - ${this.formatDisplayDate(sunday)})`;
      return {
        fromDate: this.formatLocalDateTime(monday),
        toDate: this.formatLocalDateTime(sunday)
      };
    }

    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      this.currentTimeRangeDescription = `Tháng này (Tháng ${now.getMonth() + 1}/${now.getFullYear()})`;
      return {
        fromDate: this.formatLocalDateTime(firstDay),
        toDate: this.formatLocalDateTime(lastDay)
      };
    }

    if (preset === 'custom' && this.customStartDate && this.customEndDate) {
      this.currentTimeRangeDescription = `Tùy chọn (${this.customStartDate} đến ${this.customEndDate})`;
      return {
        fromDate: `${this.customStartDate}T00:00:00`,
        toDate: `${this.customEndDate}T23:59:59`
      };
    }

    return {};
  }

  /**
   * Tính toán các chỉ số vĩ mô phục vụ các thẻ thống kê đầu trang
   */
  private calculateKpiMetrics(items: BranchStatisticResponseDto[], total: number): void {
    this.kpiTotalBranches = total;
    this.kpiOpenBranches = items.filter(b => b.status === 'OPEN').length;
    this.kpiTotalBooks = items.reduce((sum, b) => sum + (b.totalBooksInStock || 0), 0);
    this.kpiTotalAvailable = items.reduce((sum, b) => sum + (b.totalAvailableBooks || 0), 0);
    this.kpiTotalBorrowed = items.reduce((sum, b) => sum + (b.totalBorrowedBooks || 0), 0);
    this.kpiTotalBorrowSlips = items.reduce((sum, b) => sum + (b.totalBorrowSlips || 0), 0);
    this.kpiTotalRevenue = items.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);
  }

  /**
   * Định dạng Date sang chuỗi ISO YYYY-MM-DDTHH:mm:ss theo giờ địa phương
   */
  private formatLocalDateTime(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  /**
   * Định dạng Date sang chuỗi YYYY-MM-DD
   */
  private formatDateOnly(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /**
   * Định dạng hiển thị DD/MM/YYYY
   */
  private formatDisplayDate(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
}
