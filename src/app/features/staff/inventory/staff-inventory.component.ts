import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { InventoryService } from '../../admin/inventory/services/inventory.service';
import { UserService } from '../../admin/users/services/user.service';
import { CategoryService } from '../../admin/categories/services/category.service';
import { BorrowSlipService } from '../../borrow-slips/services/borrow-slip.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { InventoryFilterRequest, InventoryResponseDto } from '../../../shared/models/inventory.model';
import { CategoryResponseDto } from '../../../shared/models/category.model';
import { UserResponseDto } from '../../../shared/models/user.model';
import { BorrowSlipCreateRequest } from '../../../shared/models/borrow-slip.model';
import { environment } from '../../../../environments/environment';

/**
 * Interface biểu diễn một cuốn sách được chọn vào khu vực lập phiếu mượn
 */
export interface SelectedBorrowItem {
  inventoryId: number;
  bookId: number;
  bookTitle: string;
  isbn?: string;
  coverImageUrl?: string;
  shelfLocation?: string;
  rentalPrice: number;
  quantity: number;
  availableQuantity: number;
}

/**
 * MÀN HÌNH KHO SÁCH & LẬP PHIẾU MƯỢN CHO NHÂN VIÊN QUẦY (STAFF)
 * - Tra cứu danh sách tồn kho sách tại chi nhánh làm việc (GET /inventories/current-branch).
 * - Bộ lọc đa dạng: Tìm theo tên sách, thể loại, vị trí kệ sách.
 * - Chọn sách mượn với số lượng tùy chỉnh (mặc định 1, tối đa bằng availableQuantity). Dòng hết hàng ẩn nút chọn.
 * - Khu vực lập phiếu mượn bên dưới:
 *   + Hiển thị danh sách sách đã chọn kèm tổng số lượng, tổng tiền thuê.
 *   + Combobox tìm kiếm độc giả CUSTOMER khi gõ chữ (GET /users/customer?search=...).
 *   + Chọn phương thức thanh toán (Tiền mặt / Chuyển khoản).
 *   + Nút tạo phiếu mở Confirm Modal xác nhận và gọi API POST /borrow-slips.
 */
@Component({
  selector: 'app-staff-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './staff-inventory.component.html',
  styleUrl: './staff-inventory.component.css'
})
export class StaffInventoryComponent implements OnInit, OnDestroy {

  private inventoryService = inject(InventoryService);
  private userService = inject(UserService);
  private categoryService = inject(CategoryService);
  private borrowSlipService = inject(BorrowSlipService);
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
    sortBy: string;
    sortDir: 'asc' | 'desc';
  } = {
    bookTitle: '',
    categoryId: undefined,
    shelfLocation: '',
    sortBy: 'updatedAt',
    sortDir: 'desc'
  };

  // Lưu trữ số lượng nhập trên mỗi dòng sách (mặc định 1)
  public rowQuantities: { [inventoryId: number]: number } = {};

  // =========================================================================
  // KHU VỰC LẬP PHIẾU MƯỢN (BORROW BASKET WORKSPACE)
  // =========================================================================
  public selectedBooks: SelectedBorrowItem[] = [];

  // Tìm kiếm độc giả (Customer Autocomplete)
  public customerSearchText: string = '';
  public isSearchingCustomer: boolean = false;
  public customerSearchResults: UserResponseDto[] = [];
  public selectedCustomer: UserResponseDto | null = null;
  public showCustomerDropdown: boolean = false;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Phương thức thanh toán
  public paymentMethod: 'CASH' | 'BANK_TRANSFER' = 'CASH';

  // State Modal xác nhận tạo phiếu
  public showConfirmModal: boolean = false;
  public isSubmittingBorrowSlip: boolean = false;

  ngOnInit(): void {
    // Bước 1: Nạp danh mục thể loại
    this.loadCategories();

    // Bước 2: Nạp danh sách tồn kho chi nhánh
    this.loadInventories();

    // Bước 3: Thiết lập Debounce tìm kiếm độc giả khi gõ chữ
    this.setupCustomerSearch();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
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
          this.inventories = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;

          // Khởi tạo mặc định số lượng chọn cho từng dòng là 1
          this.inventories.forEach(item => {
            if (!this.rowQuantities[item.id]) {
              this.rowQuantities[item.id] = 1;
            }
          });
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
   * Đặt lại bộ lọc tồn kho
   */
  onResetFilters(): void {
    this.filterParams = {
      bookTitle: '',
      categoryId: undefined,
      shelfLocation: '',
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
  // XỬ LÝ CHỌN SÁCH & QUẢN LÝ KHU VỰC MƯỢN SÁCH
  // =========================================================================

  /**
   * Điều chỉnh số lượng trên dòng sách trước khi bấm nút Chọn
   */
  adjustRowQty(invId: number, delta: number, maxAvailable: number): void {
    const current = this.rowQuantities[invId] || 1;
    const next = current + delta;
    if (next >= 1 && next <= maxAvailable) {
      this.rowQuantities[invId] = next;
    }
  }

  /**
   * Kiểm tra và ép số lượng nhập bằng tay hợp lệ
   */
  onRowQtyInput(invId: number, maxAvailable: number): void {
    let current = this.rowQuantities[invId];
    if (!current || current < 1) {
      this.rowQuantities[invId] = 1;
    } else if (current > maxAvailable) {
      this.rowQuantities[invId] = maxAvailable;
      this.toastService.warning(`Số lượng tối đa khả dụng trong kho là ${maxAvailable} cuốn!`);
    }
  }

  /**
   * Bấm nút "Chọn" trên mỗi dòng sách để thêm vào khu vực lập phiếu mượn bên dưới
   */
  selectBook(inv: InventoryResponseDto): void {
    const available = inv.availableQuantity || 0;
    if (available <= 0) {
      this.toastService.warning('Sách này đã hết số lượng khả dụng trong kho!');
      return;
    }

    const qtyToAdd = this.rowQuantities[inv.id] || 1;
    const existingIndex = this.selectedBooks.findIndex(item => item.inventoryId === inv.id);

    if (existingIndex > -1) {
      const currentSelected = this.selectedBooks[existingIndex];
      const newQty = currentSelected.quantity + qtyToAdd;

      if (newQty > available) {
        currentSelected.quantity = available;
        this.toastService.warning(
          `Đã đạt số lượng tối đa trong kho (${available} cuốn) cho sách "${inv.bookTitle}"!`
        );
      } else {
        currentSelected.quantity = newQty;
        this.toastService.success(`Đã tăng thêm ${qtyToAdd} cuốn "${inv.bookTitle}" vào danh sách mượn!`);
      }
    } else {
      this.selectedBooks.push({
        inventoryId: inv.id,
        bookId: inv.bookId,
        bookTitle: inv.bookTitle,
        isbn: inv.isbn,
        coverImageUrl: inv.coverImageUrl,
        shelfLocation: inv.shelfLocation,
        rentalPrice: inv.rentalPrice || 0,
        quantity: qtyToAdd,
        availableQuantity: available
      });
      this.toastService.success(`Đã thêm "${inv.bookTitle}" vào danh sách mượn!`);
    }

    // Reset lại số lượng trên dòng về 1
    this.rowQuantities[inv.id] = 1;
  }

  /**
   * Tăng hoặc giảm số lượng một cuốn sách trong danh sách mượn
   */
  changeBasketItemQty(item: SelectedBorrowItem, delta: number): void {
    const next = item.quantity + delta;
    if (next <= 0) {
      this.removeBasketItem(item);
    } else if (next > item.availableQuantity) {
      this.toastService.warning(`Kho chỉ còn ${item.availableQuantity} cuốn khả dụng!`);
    } else {
      item.quantity = next;
    }
  }

  /**
   * Xóa một cuốn sách khỏi danh sách mượn
   */
  removeBasketItem(item: SelectedBorrowItem): void {
    this.selectedBooks = this.selectedBooks.filter(b => b.inventoryId !== item.inventoryId);
    this.toastService.info(`Đã bỏ "${item.bookTitle}" khỏi danh sách mượn.`);
  }

  /**
   * Xóa toàn bộ sách khỏi danh sách mượn
   */
  clearAllBasket(): void {
    this.selectedBooks = [];
  }

  /**
   * Tổng số lượng sách mượn
   */
  get totalBorrowQuantity(): number {
    return this.selectedBooks.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Tổng chi phí thuê mượn tạm tính
   */
  get totalBorrowAmount(): number {
    return this.selectedBooks.reduce((sum, item) => sum + (item.rentalPrice * item.quantity), 0);
  }

  // =========================================================================
  // XỬ LÝ TÌM KIẾM ĐỘC GIẢ (CUSTOMER SEARCH AUTOCOMPLETE)
  // =========================================================================

  private setupCustomerSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length === 0) {
          this.isSearchingCustomer = false;
          this.customerSearchResults = [];
          this.showCustomerDropdown = false;
          return of({ success: true, data: [] });
        }
        this.isSearchingCustomer = true;
        return this.userService.searchCustomers(query);
      })
    ).subscribe({
      next: (res) => {
        this.isSearchingCustomer = false;
        if (res.success && res.data) {
          this.customerSearchResults = res.data;
          this.showCustomerDropdown = true;
        } else {
          this.customerSearchResults = [];
        }
      },
      error: (err) => {
        this.isSearchingCustomer = false;
        this.customerSearchResults = [];
        console.error('Lỗi tìm kiếm độc giả:', err);
      }
    });
  }

  /**
   * Khi người dùng gõ vào ô tìm kiếm độc giả
   */
  onCustomerInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.customerSearchText = val;
    this.searchSubject.next(val);
  }

  /**
   * Khi chọn độc giả từ dropdown kết quả
   */
  selectCustomer(customer: UserResponseDto): void {
    this.selectedCustomer = customer;
    this.showCustomerDropdown = false;
    this.customerSearchText = '';
    this.customerSearchResults = [];
    this.toastService.success(`Đã chọn độc giả: ${customer.fullName}`);
  }

  /**
   * Đổi hoặc hủy chọn độc giả hiện tại
   */
  removeCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearchText = '';
  }

  /**
   * Đóng dropdown khi click ra ngoài
   */
  closeCustomerDropdown(): void {
    setTimeout(() => {
      this.showCustomerDropdown = false;
    }, 200);
  }

  // =========================================================================
  // TẠO PHIẾU MƯỢN (CREATE BORROW SLIP & CONFIRM FORM)
  // =========================================================================

  /**
   * Kiểm tra hợp lệ và mở Confirm Form tóm tắt phiếu mượn
   */
  openConfirmModal(): void {
    if (!this.selectedCustomer) {
      this.toastService.warning('Vui lòng tìm kiếm và chọn độc giả mượn sách!');
      return;
    }

    if (this.selectedBooks.length === 0) {
      this.toastService.warning('Danh sách mượn đang trống! Vui lòng chọn ít nhất 1 cuốn sách.');
      return;
    }

    this.showConfirmModal = true;
  }

  /**
   * Đóng Confirm Form
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

  /**
   * Xác nhận gọi API tạo phiếu mượn sách
   */
  confirmCreateBorrowSlip(): void {
    if (!this.selectedCustomer || this.selectedBooks.length === 0) return;

    this.isSubmittingBorrowSlip = true;

    const requestData: BorrowSlipCreateRequest = {
      customerId: this.selectedCustomer.userId,
      items: this.selectedBooks.map(item => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity
      })),
      paymentMethod: this.paymentMethod
    };

    this.borrowSlipService.createBorrowSlip(requestData).subscribe({
      next: (res) => {
        this.isSubmittingBorrowSlip = false;
        this.closeConfirmModal();

        const slipCode = res.data?.borrowCode || '';
        this.toastService.success(`Tạo phiếu mượn sách thành công! Mã phiếu: ${slipCode}`);

        // Reset lại khu vực mượn sách
        this.selectedBooks = [];
        this.selectedCustomer = null;

        // Tải lại danh sách tồn kho chi nhánh để cập nhật số lượng khả dụng mới nhất
        this.loadInventories();
      },
      error: (err) => {
        this.isSubmittingBorrowSlip = false;
        const msg = err.error?.message || 'Không thể tạo phiếu mượn sách!';
        this.toastService.error(msg);
      }
    });
  }

  // =========================================================================
  // XỬ LÝ HÌNH ẢNH BÌA SÁCH
  // =========================================================================

  /**
   * Chuyển đổi link ảnh sang URL đầy đủ hiển thị trên trình duyệt.
   * Tự động loại bỏ /api ở cuối baseUrl để tránh bị nhân đôi /api/api/uploads/.
   */
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

  /**
   * Xử lý khi ảnh gặp lỗi 404 hoặc không tìm thấy file trên ổ đĩa, tự động ẩn thẻ img và hiện icon fallback
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }
}
