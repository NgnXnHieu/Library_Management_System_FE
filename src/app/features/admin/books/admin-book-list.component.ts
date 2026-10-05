import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookService } from './services/book.service';
import { CategoryService } from '../categories/services/category.service';
import { BookCreateRequest, BookFilterRequest, BookResponseDto, BookUpdateRequest } from '../../../shared/models/book.model';
import { CategoryResponseDto, DisplayStatus } from '../../../shared/models/category.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

/**
 * MÀN HÌNH QUẢN LÝ ĐẦU SÁCH TOÀN HỆ THỐNG DÀNH CHO ADMIN
 * - Tìm kiếm, lọc đa tiêu chí (ISBN, tiêu đề, tác giả, NXB, thể loại, năm XB, khoảng giá, trạng thái).
 * - Sắp xếp đa dạng theo các trường (id, title, isbn, author, publicationYear, price, rentalPrice, createdAt).
 * - Phân trang linh hoạt với PaginationComponent tái sử dụng.
 * - Thêm mới đầu sách: tải ảnh bìa xem trước, tự động khởi tạo tồn kho 0 tại tất cả chi nhánh.
 * - Cập nhật đầu sách: thay đổi thông tin, đổi ảnh bìa tự dọn dẹp ảnh cũ.
 * - Chuyển đổi trạng thái hiển thị (UNHIDE <-> HIDE).
 * - Xóa đầu sách: kiểm tra ràng buộc giao dịch mượn sách trước khi xóa.
 */
@Component({
  selector: 'app-admin-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './admin-book-list.component.html',
  styleUrl: './admin-book-list.component.css'
})
export class AdminBookListComponent implements OnInit {

  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // Dữ liệu danh sách sách và phân trang
  public books: BookResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Danh mục thể loại và trạng thái hiển thị
  public categoryList: CategoryResponseDto[] = [];
  public statusList: DisplayStatus[] = ['UNHIDE', 'HIDE'];

  // Tham số bộ lọc tìm kiếm
  public filterParams: BookFilterRequest = {
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    categoryId: undefined,
    publicationYear: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minRentalPrice: undefined,
    maxRentalPrice: undefined,
    status: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  // Quản lý Modal Thêm mới / Cập nhật
  public isModalOpen: boolean = false;
  public isEditMode: boolean = false;
  public currentEditingId: number | null = null;
  public isSubmitting: boolean = false;

  // Quản lý thông báo lỗi hiển thị trên màn hình
  public pageErrorMessage: string = '';
  public modalErrorMessage: string = '';
  public deleteErrorMessage: string = '';

  // Quản lý upload và xem trước ảnh bìa sách
  public imagePreviewUrl: string | null = null;
  public isUploadingImage: boolean = false;

  // Quản lý Modal Xác nhận Xóa đầu sách
  public isDeleteModalOpen: boolean = false;
  public bookToDelete: BookResponseDto | null = null;
  public isDeleting: boolean = false;

  // Reactive Form cho Thêm mới / Cập nhật sách
  public bookForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    isbn: ['', [Validators.required, Validators.maxLength(20)]],
    categoryId: [null, [Validators.required]],
    author: ['', [Validators.maxLength(150)]],
    publisher: ['', [Validators.maxLength(150)]],
    publicationYear: [null, [Validators.min(1000), Validators.max(2100)]],
    price: [null, [Validators.min(0)]],
    rentalPrice: [null, [Validators.min(0)]],
    fineAmount: [0, [Validators.required, Validators.min(0)]],
    status: ['UNHIDE', [Validators.required]],
    description: [''],
    coverImageKey: ['']
  });

  get f() {
    return this.bookForm.controls;
  }

  /**
   * Trích xuất thông điệp lỗi chi tiết từ phản hồi của Backend
   * - Hỗ trợ bóc tách danh sách lỗi validate trường dữ liệu (err.error.data)
   * - Ưu tiên thông điệp lỗi chi tiết từ máy chủ để hiển thị lên màn hình
   */
  extractErrorMessage(err: any, fallbackMessage: string): string {
    // 1. Kiểm tra nếu backend trả về danh sách field errors dạng Object { fieldName: "thông báo lỗi" }
    if (err?.error?.data && typeof err.error.data === 'object' && !Array.isArray(err.error.data)) {
      const fieldLabels: Record<string, string> = {
        title: 'Tiêu đề sách',
        isbn: 'Mã ISBN',
        categoryId: 'Thể loại',
        author: 'Tác giả',
        publisher: 'Nhà xuất bản',
        publicationYear: 'Năm xuất bản',
        price: 'Giá bán',
        rentalPrice: 'Giá thuê',
        fineAmount: 'Tiền phạt quá hạn',
        description: 'Mô tả',
        coverImageKey: 'Ảnh bìa sách',
        status: 'Trạng thái'
      };

      const fieldErrorMessages = Object.entries(err.error.data).map(([field, msg]) => {
        const label = fieldLabels[field] || field;
        return `${label}: ${msg}`;
      });

      if (fieldErrorMessages.length > 0) {
        return fieldErrorMessages.join(' • ');
      }
    }

    // 2. Nếu có message trực tiếp từ API backend
    if (err?.error?.message && typeof err.error.message === 'string' && err.error.message.trim()) {
      return err.error.message;
    }

    // 3. Nếu có lỗi chung từ HttpErrorResponse
    if (err?.message && typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return fallbackMessage;
  }

  ngOnInit(): void {
    // Bước 1: Nạp danh mục thể loại để đổ vào các ô chọn (dropdowns)
    this.loadCategories();

    // Bước 2: Tải danh sách đầu sách trang đầu tiên
    this.loadBooks();
  }

  /**
   * Tải toàn bộ danh mục thể loại từ Backend để hiển thị trên Dropdown
   */
  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categoryList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminBookList] Lỗi tải danh sách thể loại:', err);
      }
    });
  }

  /**
   * Gọi API tải danh sách đầu sách theo bộ lọc, trang và kích thước trang hiện tại
   */
  loadBooks(): void {
    this.isLoading = true;
    const requestPayload: BookFilterRequest = {
      ...this.filterParams,
      page: this.currentPage,
      size: this.pageSize
    };

    this.bookService.getAdminBooks(requestPayload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.pageErrorMessage = '';
        if (res.success && res.data) {
          this.books = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        } else {
          this.books = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.books = [];
        this.totalElements = 0;
        this.totalPages = 0;
        console.error('[AdminBookList] Lỗi tải danh sách đầu sách:', err);
        const msg = this.extractErrorMessage(err, 'Không thể tải danh sách đầu sách, vui lòng thử lại sau!');
        this.pageErrorMessage = msg;
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xử lý sắp xếp khi người dùng nhấn trực tiếp vào tiêu đề cột của bảng
   */
  onSort(field: string): void {
    if (this.filterParams.sortBy === field) {
      this.filterParams.sortDir = this.filterParams.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filterParams.sortBy = field;
      this.filterParams.sortDir = 'desc';
    }
    this.currentPage = 0;
    this.loadBooks();
  }

  /**
   * Xử lý khi thay đổi lựa chọn trong dropdown sắp xếp
   */
  onSortChange(): void {
    this.currentPage = 0;
    this.loadBooks();
  }

  /**
   * Trả về icon biểu thị trạng thái sắp xếp của từng cột
   */
  getSortIcon(field: string): string {
    if (this.filterParams.sortBy !== field) {
      return '↕️';
    }
    return this.filterParams.sortDir === 'asc' ? '⬆️' : '⬇️';
  }

  /**
   * Xử lý khi nhấn nút "Tìm Kiếm"
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadBooks();
  }

  /**
   * Xử lý khi nhấn nút "Làm Mới": xóa toàn bộ bộ lọc về trạng thái ban đầu
   */
  onReset(): void {
    this.filterParams = {
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      categoryId: undefined,
      publicationYear: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRentalPrice: undefined,
      maxRentalPrice: undefined,
      status: '',
      sortBy: 'createdAt',
      sortDir: 'desc'
    };
    this.pageSize = 10;
    this.currentPage = 0;
    this.loadBooks();
    this.toastService.info('Đã đặt lại bộ lọc tìm kiếm và sắp xếp mặc định.');
  }

  /**
   * Xử lý khi chuyển trang từ PaginationComponent
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBooks();
  }

  /**
   * Xử lý khi thay đổi kích thước trang (5, 10, 20, 50, 100)
   */
  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 0;
    this.loadBooks();
  }

  /**
   * Chuyển đổi link ảnh sang URL đầy đủ hiển thị trên trình duyệt
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
   * Mở modal thêm mới đầu sách
   */
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentEditingId = null;
    this.imagePreviewUrl = null;
    this.modalErrorMessage = '';
    this.bookForm.reset({
      title: '',
      isbn: '',
      categoryId: null,
      author: '',
      publisher: '',
      publicationYear: null,
      price: null,
      rentalPrice: null,
      fineAmount: 0,
      status: 'UNHIDE',
      description: '',
      coverImageKey: ''
    });
    this.isModalOpen = true;
  }

  /**
   * Mở modal chỉnh sửa đầu sách và điền thông tin hiện tại
   */
  openEditModal(book: BookResponseDto): void {
    this.isEditMode = true;
    this.currentEditingId = book.id;
    this.modalErrorMessage = '';
    this.imagePreviewUrl = book.coverImageUrl ? this.getImageUrl(book.coverImageUrl) : null;
    this.bookForm.patchValue({
      title: book.title,
      isbn: book.isbn,
      categoryId: book.categoryId,
      author: book.author || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || null,
      price: book.price != null ? Number(book.price) : null,
      rentalPrice: book.rentalPrice != null ? Number(book.rentalPrice) : null,
      fineAmount: book.fineAmount != null ? Number(book.fineAmount) : 0,
      status: book.status,
      description: book.description || '',
      coverImageKey: book.coverImageKey || ''
    });
    this.isModalOpen = true;
  }

  /**
   * Đóng modal thêm/sửa sách
   */
  closeModal(): void {
    this.isModalOpen = false;
    this.modalErrorMessage = '';
    this.imagePreviewUrl = null;
    this.bookForm.reset();
  }

  /**
   * Xử lý chọn file ảnh bìa sách từ máy:
   * Validate, gọi upload trước lên server lấy fileKey và xem trước ngay lập tức
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Kiểm tra định dạng ảnh
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.toastService.error('Chỉ chấp nhận tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF!');
      input.value = '';
      return;
    }

    // Giới hạn dung lượng tối đa 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error('Dung lượng ảnh vượt quá giới hạn tối đa 10MB!');
      input.value = '';
      return;
    }

    this.isUploadingImage = true;
    this.modalErrorMessage = '';
    this.bookService.uploadBookCover(file).subscribe({
      next: (res) => {
        this.isUploadingImage = false;
        if (res.success && res.data) {
          const fileKey = res.data.fileKey;
          const fileUrl = res.data.fileUrl || res.data.fileKey;
          this.bookForm.patchValue({ coverImageKey: fileKey });
          this.imagePreviewUrl = this.getImageUrl(fileUrl);
          this.toastService.success('Tải ảnh bìa sách lên thành công!');
        }
        input.value = '';
      },
      error: (err) => {
        this.isUploadingImage = false;
        input.value = '';
        console.error('[AdminBookList] Lỗi tải ảnh bìa lên server:', err);
        const msg = this.extractErrorMessage(err, 'Không thể tải ảnh bìa lên, vui lòng thử lại!');
        this.modalErrorMessage = msg;
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Gỡ bỏ ảnh bìa đã chọn
   */
  onRemoveImage(): void {
    this.imagePreviewUrl = null;
    this.bookForm.patchValue({ coverImageKey: '' });
  }

  /**
   * Xử lý lỗi load ảnh trên bảng dữ liệu
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLElement;
    target.style.display = 'none';
    const fallback = target.nextElementSibling as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  }

  /**
   * Lưu thông tin sách (Thêm mới hoặc Cập nhật)
   */
  onSaveBook(): void {
    this.modalErrorMessage = '';
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      this.modalErrorMessage = 'Vui lòng kiểm tra lại các trường bắt buộc có dấu (*) và đảm bảo dữ liệu hợp lệ!';
      this.toastService.warning('Vui lòng kiểm tra lại các trường bắt buộc!');
      return;
    }

    this.isSubmitting = true;
    const formVal = this.bookForm.value;

    if (this.isEditMode && this.currentEditingId) {
      // Logic CẬP NHẬT sách
      const updatePayload: BookUpdateRequest = {
        title: formVal.title?.trim(),
        isbn: formVal.isbn?.trim().toUpperCase(),
        categoryId: Number(formVal.categoryId),
        author: formVal.author?.trim() || undefined,
        publisher: formVal.publisher?.trim() || undefined,
        publicationYear: formVal.publicationYear ? Number(formVal.publicationYear) : undefined,
        price: formVal.price != null && formVal.price !== '' ? Number(formVal.price) : undefined,
        rentalPrice: formVal.rentalPrice != null && formVal.rentalPrice !== '' ? Number(formVal.rentalPrice) : undefined,
        fineAmount: formVal.fineAmount != null && formVal.fineAmount !== '' ? Number(formVal.fineAmount) : undefined,
        status: formVal.status,
        description: formVal.description?.trim() || undefined,
        coverImageKey: formVal.coverImageKey || undefined
      };

      this.bookService.updateBook(this.currentEditingId, updatePayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.toastService.success('Cập nhật đầu sách thành công!');
            this.closeModal();
            this.loadBooks();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('[AdminBookList] Lỗi cập nhật đầu sách:', err);
          const msg = this.extractErrorMessage(err, 'Có lỗi xảy ra khi cập nhật đầu sách!');
          this.modalErrorMessage = msg;
          this.toastService.error(msg);
        }
      });
    } else {
      // Logic THÊM MỚI sách
      const createPayload: BookCreateRequest = {
        title: formVal.title.trim(),
        isbn: formVal.isbn.trim().toUpperCase(),
        categoryId: Number(formVal.categoryId),
        author: formVal.author?.trim() || undefined,
        publisher: formVal.publisher?.trim() || undefined,
        publicationYear: formVal.publicationYear ? Number(formVal.publicationYear) : undefined,
        price: formVal.price != null && formVal.price !== '' ? Number(formVal.price) : undefined,
        rentalPrice: formVal.rentalPrice != null && formVal.rentalPrice !== '' ? Number(formVal.rentalPrice) : undefined,
        fineAmount: formVal.fineAmount != null && formVal.fineAmount !== '' ? Number(formVal.fineAmount) : 0,
        status: formVal.status,
        description: formVal.description?.trim() || undefined,
        coverImageKey: formVal.coverImageKey || undefined
      };

      this.bookService.createBook(createPayload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.toastService.success('Thêm mới đầu sách thành công! Đã tự động tạo tồn kho 0 tại tất cả chi nhánh.');
            this.closeModal();
            this.loadBooks();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('[AdminBookList] Lỗi thêm mới đầu sách:', err);
          const msg = this.extractErrorMessage(err, 'Có lỗi xảy ra khi thêm mới đầu sách!');
          this.modalErrorMessage = msg;
          this.toastService.error(msg);
        }
      });
    }
  }

  /**
   * Bật/Tắt trạng thái hiển thị của đầu sách trực tiếp trên bảng
   */
  onToggleStatus(book: BookResponseDto): void {
    const actionText = book.status === 'UNHIDE' ? 'ẩn' : 'hiển thị công khai';
    this.bookService.toggleBookStatus(book.id, book.status).subscribe({
      next: (res) => {
        if (res.success) {
          const nextStatus: DisplayStatus = book.status === 'UNHIDE' ? 'HIDE' : 'UNHIDE';
          book.status = nextStatus;
          this.toastService.success(`Đã chuyển trạng thái đầu sách "${book.title}" sang ${actionText}!`);
        }
      },
      error: (err) => {
        console.error('[AdminBookList] Lỗi đổi trạng thái đầu sách:', err);
        const msg = this.extractErrorMessage(err, 'Không thể đổi trạng thái sách, vui lòng thử lại!');
        this.pageErrorMessage = msg;
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Mở modal xác nhận xóa đầu sách
   */
  openDeleteModal(book: BookResponseDto): void {
    this.bookToDelete = book;
    this.deleteErrorMessage = '';
    this.isDeleteModalOpen = true;
  }

  /**
   * Đóng modal xác nhận xóa
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.bookToDelete = null;
    this.deleteErrorMessage = '';
  }

  /**
   * Xác nhận xóa đầu sách khỏi hệ thống
   */
  confirmDelete(): void {
    if (!this.bookToDelete) return;

    this.isDeleting = true;
    this.deleteErrorMessage = '';
    const bookTitle = this.bookToDelete.title;
    this.bookService.deleteBook(this.bookToDelete.id).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.toastService.success(`Đã xóa thành công đầu sách "${bookTitle}"!`);
        this.closeDeleteModal();
        this.loadBooks();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('[AdminBookList] Lỗi xóa đầu sách:', err);
        const msg = this.extractErrorMessage(err, 'Không thể xóa đầu sách do đã phát sinh giao dịch mượn!');
        this.deleteErrorMessage = msg;
        this.pageErrorMessage = msg;
        this.toastService.error(msg);
      }
    });
  }
}
