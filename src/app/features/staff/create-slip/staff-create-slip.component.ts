import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { InventoryService } from '../../admin/inventory/services/inventory.service';
import { UserService } from '../../admin/users/services/user.service';
import { BorrowSlipService } from '../../borrow-slips/services/borrow-slip.service';
import { ToastService } from '../../../core/services/toast.service';
import { InventoryResponseDto } from '../../../shared/models/inventory.model';
import { UserResponseDto } from '../../../shared/models/user.model';
import { BorrowSlipCreateRequest } from '../../../shared/models/borrow-slip.model';
import { environment } from '../../../../environments/environment';

/**
 * Interface đại diện cho một cuốn sách được chọn vào giỏ mượn sách
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
 * MÀN HÌNH QUẦY GIAO DỊCH LẬP PHIẾU MƯỢN SÁCH (CIRCULATION DESK POS)
 * - Tối ưu hóa cho tốc độ thao tác của nhân viên quầy:
 *   1. Tìm kiếm sách nhanh theo tên/ISBN hoặc nhận sách truyền từ màn hình Kho sách.
 *   2. Quản lý giỏ sách mượn với điều khiển số lượng tự động chặn vượt mức tồn kho khả dụng.
 *   3. Tìm kiếm độc giả thông minh theo Tên, SĐT, Email (Autocomplete Debounce).
 *   4. Lựa chọn phương thức thanh toán (Tiền mặt / Chuyển khoản QR).
 *   5. Xác nhận và gọi API POST /borrow-slips tạo phiếu mượn thời gian thực.
 */
@Component({
  selector: 'app-staff-create-slip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-create-slip.component.html',
  styleUrl: './staff-create-slip.component.css'
})
export class StaffCreateSlipComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private userService = inject(UserService);
  private borrowSlipService = inject(BorrowSlipService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // =========================================================================
  // 1. TÌM KIẾM SÁCH NHANH TẠI CHI NHÁNH (QUICK BOOK SEARCH)
  // =========================================================================
  public bookSearchText: string = '';
  public isSearchingBook: boolean = false;
  public bookSearchResults: InventoryResponseDto[] = [];
  public showBookDropdown: boolean = false;
  private bookSearchSubject = new Subject<string>();
  private bookSearchSubscription?: Subscription;

  // =========================================================================
  // 2. GIỎ SÁCH MƯỢN (BORROW BASKET)
  // =========================================================================
  public selectedBooks: SelectedBorrowItem[] = [];

  // =========================================================================
  // 3. TÌM KIẾM ĐỘC GIẢ (CUSTOMER AUTOCOMPLETE)
  // =========================================================================
  public customerSearchText: string = '';
  public isSearchingCustomer: boolean = false;
  public customerSearchResults: UserResponseDto[] = [];
  public selectedCustomer: UserResponseDto | null = null;
  public showCustomerDropdown: boolean = false;
  private customerSearchSubject = new Subject<string>();
  private customerSearchSubscription?: Subscription;

  // =========================================================================
  // 4. HÌNH THỨC THANH TOÁN & GHI CHÚ
  // =========================================================================
  public paymentMethod: 'CASH' | 'BANK_TRANSFER' = 'CASH';

  // =========================================================================
  // 5. TRẠNG THÁI MODAL XÁC NHẬN VÀ KẾT QUẢ TẠO PHIẾU
  // =========================================================================
  public showConfirmModal: boolean = false;
  public isSubmittingBorrowSlip: boolean = false;
  public createdSlipCode: string = '';
  public showSuccessModal: boolean = false;

  ngOnInit(): void {
    // Bước 1: Khởi tạo luồng tìm kiếm sách nhanh
    this.setupBookSearch();

    // Bước 2: Khởi tạo luồng tìm kiếm độc giả
    this.setupCustomerSearch();

    // Bước 3: Kiểm tra xem có sách được truyền sang từ màn hình Tra Cứu Kho Sách không
    this.checkPreSelectedBook();
  }

  ngOnDestroy(): void {
    this.bookSearchSubscription?.unsubscribe();
    this.customerSearchSubscription?.unsubscribe();
  }

  /**
   * Kiểm tra navigation state xem có sách chuyển từ trang Kho sang không
   */
  private checkPreSelectedBook(): void {
    const navState = history.state;
    if (navState && navState.preSelectedBook) {
      const inv: InventoryResponseDto = navState.preSelectedBook;
      this.addBookToBasket(inv);
      this.toastService.info(`Đã nạp sẵn sách "${inv.bookTitle}" vào giỏ mượn!`);
      // Xóa state để tránh reload lại add trùng
      history.replaceState({}, '');
    }
  }

  // =========================================================================
  // XỬ LÝ TÌM KIẾM SÁCH NHANH (BOOK AUTOCOMPLETE)
  // =========================================================================

  private setupBookSearch(): void {
    this.bookSearchSubscription = this.bookSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length === 0) {
          this.isSearchingBook = false;
          this.bookSearchResults = [];
          this.showBookDropdown = false;
          return of({ success: true, data: { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 } });
        }
        this.isSearchingBook = true;
        // Tìm kiếm sách khả dụng tại chi nhánh hiện tại
        return this.inventoryService.getMyBranchInventories({
          page: 0,
          size: 8,
          bookTitle: query.trim()
        });
      })
    ).subscribe({
      next: (res) => {
        this.isSearchingBook = false;
        if (res.success && res.data) {
          this.bookSearchResults = res.data.content;
          this.showBookDropdown = true;
        } else {
          this.bookSearchResults = [];
        }
      },
      error: (err) => {
        this.isSearchingBook = false;
        this.bookSearchResults = [];
        console.error('Lỗi tìm kiếm sách chi nhánh:', err);
      }
    });
  }

  onBookInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.bookSearchText = val;
    this.bookSearchSubject.next(val);
  }

  closeBookDropdown(): void {
    setTimeout(() => {
      this.showBookDropdown = false;
    }, 250);
  }

  /**
   * Thêm sách vào giỏ mượn khi click từ kết quả tìm kiếm
   */
  addBookToBasket(inv: InventoryResponseDto): void {
    const available = inv.availableQuantity || 0;
    if (available <= 0) {
      this.toastService.warning(`Sách "${inv.bookTitle}" hiện đã hết hàng trong kho chi nhánh!`);
      return;
    }

    const existingIndex = this.selectedBooks.findIndex(b => b.inventoryId === inv.id);

    if (existingIndex > -1) {
      const current = this.selectedBooks[existingIndex];
      if (current.quantity >= available) {
        this.toastService.warning(`Đã đạt giới hạn tối đa (${available} cuốn) trong kho cho sách này!`);
        return;
      }
      current.quantity += 1;
      this.toastService.success(`Đã tăng số lượng "${inv.bookTitle}" lên ${current.quantity} cuốn.`);
    } else {
      this.selectedBooks.push({
        inventoryId: inv.id,
        bookId: inv.bookId,
        bookTitle: inv.bookTitle,
        isbn: inv.isbn,
        coverImageUrl: inv.coverImageUrl,
        shelfLocation: inv.shelfLocation,
        rentalPrice: inv.rentalPrice || 0,
        quantity: 1,
        availableQuantity: available
      });
      this.toastService.success(`Đã thêm "${inv.bookTitle}" vào giỏ mượn.`);
    }

    // Reset ô tìm kiếm sách
    this.bookSearchText = '';
    this.bookSearchResults = [];
    this.showBookDropdown = false;
  }

  // =========================================================================
  // XỬ LÝ THAO TÁC TRÊN GIỎ MƯỢN (BASKET OPERATIONS)
  // =========================================================================

  /**
   * Tăng hoặc giảm số lượng sách trong giỏ
   */
  changeBasketItemQty(item: SelectedBorrowItem, delta: number): void {
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) {
      this.removeBasketItem(item);
    } else if (nextQty > item.availableQuantity) {
      this.toastService.warning(`Kho chi nhánh chỉ còn ${item.availableQuantity} cuốn khả dụng!`);
    } else {
      item.quantity = nextQty;
    }
  }

  /**
   * Xóa một đầu sách khỏi giỏ
   */
  removeBasketItem(item: SelectedBorrowItem): void {
    this.selectedBooks = this.selectedBooks.filter(b => b.inventoryId !== item.inventoryId);
    this.toastService.info(`Đã bỏ "${item.bookTitle}" khỏi giỏ.`);
  }

  /**
   * Xóa toàn bộ giỏ sách
   */
  clearAllBasket(): void {
    this.selectedBooks = [];
    this.toastService.info('Đã xóa toàn bộ sách trong giỏ.');
  }

  /**
   * Tổng số lượng cuốn sách mượn
   */
  get totalBorrowQuantity(): number {
    return this.selectedBooks.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Tổng tiền thuê mượn tạm tính
   */
  get totalBorrowAmount(): number {
    return this.selectedBooks.reduce((sum, item) => sum + (item.rentalPrice * item.quantity), 0);
  }

  // =========================================================================
  // XỬ LÝ TÌM KIẾM ĐỘC GIẢ (CUSTOMER AUTOCOMPLETE)
  // =========================================================================

  private setupCustomerSearch(): void {
    this.customerSearchSubscription = this.customerSearchSubject.pipe(
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

  onCustomerInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.customerSearchText = val;
    this.customerSearchSubject.next(val);
  }

  closeCustomerDropdown(): void {
    setTimeout(() => {
      this.showCustomerDropdown = false;
    }, 250);
  }

  selectCustomer(customer: UserResponseDto): void {
    this.selectedCustomer = customer;
    this.showCustomerDropdown = false;
    this.customerSearchText = '';
    this.customerSearchResults = [];
    this.toastService.success(`Đã chọn độc giả: ${customer.fullName}`);
  }

  removeCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearchText = '';
  }

  // =========================================================================
  // XỬ LÝ TẠO PHIẾU MƯỢN (CREATE BORROW SLIP)
  // =========================================================================

  openConfirmModal(): void {
    if (this.selectedBooks.length === 0) {
      this.toastService.warning('Giỏ mượn đang trống! Vui lòng chọn ít nhất 1 cuốn sách.');
      return;
    }
    if (!this.selectedCustomer) {
      this.toastService.warning('Vui lòng tìm và chọn thông tin độc giả mượn sách!');
      return;
    }
    this.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
  }

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

        this.createdSlipCode = res.data?.borrowCode || '';
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isSubmittingBorrowSlip = false;
        const msg = err.error?.message || 'Không thể tạo phiếu mượn sách. Vui lòng thử lại!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Reset toàn bộ form để tiếp tục lập phiếu mượn cho lượt khách tiếp theo
   */
  resetForNextBorrower(): void {
    this.showSuccessModal = false;
    this.createdSlipCode = '';
    this.selectedBooks = [];
    this.selectedCustomer = null;
    this.customerSearchText = '';
    this.bookSearchText = '';
    this.paymentMethod = 'CASH';
  }

  /**
   * Chuyển hướng sang danh sách phiếu mượn để theo dõi
   */
  goToBorrowSlipList(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/staff/borrow-slips']);
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
