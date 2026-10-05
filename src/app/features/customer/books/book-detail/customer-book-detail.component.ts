import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../../../core/services/book.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BookDetailCustomerResponseDto, BookBranchInventoryDto } from '../../../../shared/models/book.model';

/**
 * MÀN HÌNH XEM CHI TIẾT SÁCH DÀNH CHO KHÁCH HÀNG (CUSTOMER BOOK DETAIL)
 * - Tích hợp API GET /public/books/{bookId} (VD: http://localhost:8080/api/public/books/1)
 * - Hiển thị đầy đủ thông tin sách: Tiêu đề, Tác giả, Thể loại, Bìa sách, Giá mượn/ngày, Giá bìa, Phí phạt, Mô tả chi tiết
 * - Bảng tra cứu tình trạng tồn kho theo từng chi nhánh thư viện (Branch Inventories)
 * - Nút hành động mượn sách hoặc điều hướng thuận tiện
 */
@Component({
  selector: 'app-customer-book-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-book-detail.component.html',
  styleUrl: './customer-book-detail.component.css'
})
export class CustomerBookDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  public authService = inject(AuthService);

  // Trạng thái dữ liệu
  public bookId: number | null = null;
  public book: BookDetailCustomerResponseDto | null = null;
  public isLoading: boolean = false;
  public errorMessage: string = '';

  // Tab nội dung đang xem (desc: Giới thiệu | inventories: Tồn kho chi nhánh | specs: Thông số kỹ thuật)
  public activeTab: 'desc' | 'inventories' | 'specs' = 'desc';

  ngOnInit(): void {
    // Lắng nghe thay đổi ID trên URL
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.bookId = Number(idParam);
        this.loadBookDetail(this.bookId);
      } else {
        this.errorMessage = 'Không tìm thấy mã sách hợp lệ trên đường dẫn.';
      }
    });
  }

  /**
   * Gọi API GET /public/books/{bookId} để lấy toàn bộ thông tin chi tiết sách & tồn kho
   * @param bookId ID của sách
   */
  public loadBookDetail(bookId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bookService.getPublicBookDetail(bookId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.data) {
          this.book = response.data;
        } else {
          this.errorMessage = 'Không tìm thấy dữ liệu của đầu sách này.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[CustomerBookDetail] Lỗi khi tải chi tiết sách:', err);
        if (err.status === 404) {
          this.errorMessage = 'Đầu sách này không tồn tại hoặc đã bị ẩn khỏi hệ thống.';
        } else {
          this.errorMessage = 'Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại sau.';
        }
      }
    });
  }

  /**
   * Chuyển tab hiển thị chi tiết
   */
  public setActiveTab(tab: 'desc' | 'inventories' | 'specs'): void {
    this.activeTab = tab;
  }

  /**
   * Tính tổng số lượng sách đang sẵn sàng cho mượn trên toàn bộ chi nhánh
   */
  public get totalAvailableCopies(): number {
    if (!this.book || !this.book.inventories) return 0;
    return this.book.inventories.reduce((sum, inv) => sum + (inv.availableQuantity || 0), 0);
  }

  /**
   * Kiểm tra xem còn sách để mượn ở bất kỳ chi nhánh nào không
   */
  public get hasAvailableCopies(): boolean {
    return this.totalAvailableCopies > 0;
  }

  /**
   * Xử lý khi bấm nút mượn sách
   * @param inventory Tồn kho chi nhánh được chọn (nếu có)
   */
  public handleBorrow(inventory?: BookBranchInventoryDto): void {
    if (!this.authService.isAuthenticated()) {
      // Nếu chưa đăng nhập, chuyển sang trang login và lưu URL quay lại
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/books/${this.bookId}` }
      });
      return;
    }

    // Nếu đã đăng nhập, chuyển sang trang quản lý phiếu mượn của độc giả
    this.router.navigate(['/borrow-slips']);
  }
}
