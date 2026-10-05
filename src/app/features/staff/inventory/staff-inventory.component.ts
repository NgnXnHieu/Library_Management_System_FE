import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InventoryService } from '../../admin/inventory/services/inventory.service';
import { CategoryService } from '../../admin/categories/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { InventoryFilterRequest, InventoryResponseDto } from '../../../shared/models/inventory.model';
import { CategoryResponseDto } from '../../../shared/models/category.model';
import { environment } from '../../../../environments/environment';

/**
 * MÀN HÌNH TRA CỨU KHO SÁCH CHI NHÁNH DÀNH CHO NHÂN VIÊN QUẦY (STAFF INVENTORY LOOKUP)
 * - Tập trung 100% vào nghiệp vụ tra cứu và kiểm tra thông tin sách tại chi nhánh:
 *   + Xem số lượng tồn kho thực tế, số lượng khả dụng, số lượng đang được mượn.
 *   + Tra cứu chính xác vị trí kệ sách để hướng dẫn bạn đọc hoặc thủ thư tự lấy sách.
 *   + Bộ lọc thông minh: Theo tên sách, mã ISBN, thể loại, vị trí kệ, trạng thái còn/hết.
 *   + Thẻ thống kê KPI tổng quan kho sách chi nhánh.
 *   + Nút shortcut "Mượn Cuốn Này ↗" chuyển hướng trực tiếp sang màn hình Lập Phiếu Mượn.
 */
@Component({
  selector: 'app-staff-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './staff-inventory.component.html',
  styleUrl: './staff-inventory.component.css'
})
export class StaffInventoryComponent implements OnInit {

  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // Dữ liệu kho sách và phân trang
  public inventories: InventoryResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoadingInventories: boolean = false;

  // Danh mục thể loại phục vụ bộ lọc
  public categories: CategoryResponseDto[] = [];

  // Tham số bộ lọc kho sách
  public filterParams: {
    bookTitle: string;
    categoryId?: number;
    shelfLocation: string;
    stockStatus: 'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK';
    sortBy: string;
    sortDir: 'asc' | 'desc';
  } = {
    bookTitle: '',
    categoryId: undefined,
    shelfLocation: '',
    stockStatus: 'ALL',
    sortBy: 'updatedAt',
    sortDir: 'desc'
  };

  // State Modal xem nhanh chi tiết một đầu sách
  public selectedBookDetail: InventoryResponseDto | null = null;
  public showDetailModal: boolean = false;

  ngOnInit(): void {
    // Bước 1: Nạp danh mục thể loại
    this.loadCategories();

    // Bước 2: Nạp danh sách tồn kho chi nhánh
    this.loadInventories();
  }

  /**
   * Tải danh mục thể loại sách
   */
  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data;
        }
      },
      error: (err) => console.error('Lỗi tải danh mục thể loại:', err)
    });
  }

  /**
   * Tải danh sách tồn kho chi nhánh của nhân viên hiện tại
   */
  loadInventories(): void {
    this.isLoadingInventories = true;

    const filter: InventoryFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      bookTitle: this.filterParams.bookTitle.trim() || undefined,
      categoryId: this.filterParams.categoryId,
      shelfLocation: this.filterParams.shelfLocation.trim() || undefined,
      sortBy: this.filterParams.sortBy,
      sortDir: this.filterParams.sortDir
    };

    this.inventoryService.getMyBranchInventories(filter).subscribe({
      next: (res) => {
        this.isLoadingInventories = false;
        if (res.success && res.data) {
          let list = res.data.content;

          // Lọc client-side theo trạng thái còn/hết nếu người dùng chọn
          if (this.filterParams.stockStatus === 'AVAILABLE') {
            list = list.filter(item => (item.availableQuantity || 0) > 0);
          } else if (this.filterParams.stockStatus === 'OUT_OF_STOCK') {
            list = list.filter(item => (item.availableQuantity || 0) <= 0);
          }

          this.inventories = list;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        }
      },
      error: (err) => {
        this.isLoadingInventories = false;
        const msg = err.error?.message || 'Không thể tải danh sách tồn kho chi nhánh!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xử lý tìm kiếm sách
   */
  onSearchInventories(): void {
    this.currentPage = 0;
    this.loadInventories();
  }

  /**
   * Đặt lại toàn bộ bộ lọc tồn kho về mặc định
   */
  onResetFilters(): void {
    this.filterParams = {
      bookTitle: '',
      categoryId: undefined,
      shelfLocation: '',
      stockStatus: 'ALL',
      sortBy: 'updatedAt',
      sortDir: 'desc'
    };
    this.currentPage = 0;
    this.loadInventories();
  }

  /**
   * Đổi trang
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInventories();
  }

  /**
   * Đổi số dòng mỗi trang
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadInventories();
  }

  // =========================================================================
  // THỐNG KÊ NHANH TỒN KHO CHI NHÁNH (KPI STATS)
  // =========================================================================

  get totalCopiesOnPage(): number {
    return this.inventories.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
  }

  get availableCopiesOnPage(): number {
    return this.inventories.reduce((sum, item) => sum + (item.availableQuantity || 0), 0);
  }

  get outOfStockCountOnPage(): number {
    return this.inventories.filter(item => (item.availableQuantity || 0) <= 0).length;
  }

  // =========================================================================
  // ĐIỀU HƯỚNG SANG MÀN HÌNH LẬP PHIẾU MƯỢN (SHORTCUT CHỌN MƯỢN)
  // =========================================================================

  /**
   * Chuyển hướng sang màn hình Quầy Lập Phiếu Mượn
   * @param book Sách được chọn (nếu có) để truyền sang nạp sẵn vào giỏ
   */
  goToCreateSlip(book?: InventoryResponseDto): void {
    if (book) {
      if ((book.availableQuantity || 0) <= 0) {
        this.toastService.warning(`Sách "${book.bookTitle}" hiện đã hết cuốn khả dụng trong kho!`);
        return;
      }
      this.router.navigate(['/staff/create-slip'], {
        state: { preSelectedBook: book }
      });
    } else {
      this.router.navigate(['/staff/create-slip']);
    }
  }

  // =========================================================================
  // MODAL XEM CHI TIẾT SÁCH (QUICK VIEW MODAL)
  // =========================================================================

  openBookDetail(book: InventoryResponseDto): void {
    this.selectedBookDetail = book;
    this.showDetailModal = true;
  }

  closeBookDetail(): void {
    this.showDetailModal = false;
    this.selectedBookDetail = null;
  }

  // =========================================================================
  // XỬ LÝ HÌNH ẢNH BÌA SÁCH
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
}
