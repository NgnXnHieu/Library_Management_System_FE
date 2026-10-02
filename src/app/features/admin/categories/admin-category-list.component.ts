import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from './services/category.service';
import {
  CategoryCreateRequest,
  CategoryFilterRequest,
  CategoryResponseDto,
  CategoryUpdateRequest,
  DisplayStatus
} from '../../../shared/models/category.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';

/**
 * MÀN HÌNH QUẢN LÝ DANH MỤC THỂ LOẠI DÀNH CHO ADMIN (CATEGORY MANAGEMENT)
 * - Tìm kiếm, lọc đa tiêu chí và phân trang danh sách thể loại (mặc định createdAt mới nhất lên đầu).
 * - Tự động nạp danh sách DisplayStatus từ API public.
 * - Hỗ trợ Thêm mới thể loại qua Modal.
 * - Hỗ trợ Cập nhật thông tin thể loại qua Modal.
 * - Hỗ trợ Bật/Tắt trạng thái hiển thị (UNHIDE <-> HIDE) trực tiếp trên từng dòng.
 * - Hỗ trợ sắp xếp linh hoạt qua combobox hoặc click trực tiếp vào header cột.
 */
@Component({
  selector: 'app-admin-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './admin-category-list.component.html',
  styleUrl: './admin-category-list.component.css'
})
export class AdminCategoryListComponent implements OnInit {

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);

  // Dữ liệu danh sách thể loại và phân trang
  public categories: CategoryResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Danh sách các trạng thái hiển thị lấy từ API public
  public statusList: DisplayStatus[] = [];

  // Đối tượng lưu giá trị các ô lọc trên giao diện
  public filterParams: CategoryFilterRequest = {
    name: '',
    description: '',
    status: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  // Quản lý Modal Thêm mới / Cập nhật
  public isModalOpen: boolean = false;
  public isEditMode: boolean = false;
  public currentEditingId: number | null = null;
  public isSubmitting: boolean = false;

  // Reactive Form cho Thêm mới / Cập nhật
  public categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    status: ['UNHIDE', [Validators.required]]
  });

  get f() {
    return this.categoryForm.controls;
  }

  ngOnInit(): void {
    // Bước 1: Nạp danh sách các trạng thái hiển thị từ API public
    this.loadStatuses();

    // Bước 2: Tải dữ liệu ban đầu
    this.loadCategories();
  }

  /**
   * Gọi API public lấy danh sách enum DisplayStatus (HIDE, UNHIDE)
   */
  loadStatuses(): void {
    this.categoryService.getDisplayStatuses().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.statusList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminCategoryList] Lỗi tải danh sách trạng thái thể loại:', err);
      }
    });
  }

  /**
   * Gọi API lấy danh sách phân trang thể loại kèm các tham số lọc hiện tại
   */
  loadCategories(): void {
    this.isLoading = true;

    const request: CategoryFilterRequest = {
      name: this.filterParams.name,
      description: this.filterParams.description,
      status: this.filterParams.status,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.filterParams.sortBy || 'createdAt',
      sortDir: this.filterParams.sortDir || 'desc'
    };

    this.categoryService.getCategoriesWithFilter(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.categories = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
          this.currentPage = res.data.number;
          this.pageSize = res.data.size;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AdminCategoryList] Lỗi tải danh sách thể loại:', err);
        this.toastService.error('Không thể tải danh sách thể loại!');
      }
    });
  }

  /**
   * Xử lý sắp xếp dữ liệu khi click vào tiêu đề cột trong bảng
   * @param field Tên trường cần sắp xếp ('name', 'description', 'status', 'createdAt')
   */
  onSort(field: string): void {
    if (this.filterParams.sortBy === field) {
      // Đảo chiều sắp xếp nếu click vào đúng cột đang chọn
      this.filterParams.sortDir = this.filterParams.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      // Đổi sang cột mới
      this.filterParams.sortBy = field;
      // Ngày tạo mặc định giảm dần (mới nhất), các trường văn bản mặc định tăng dần (A-Z)
      this.filterParams.sortDir = field === 'createdAt' ? 'desc' : 'asc';
    }
    this.currentPage = 0;
    this.loadCategories();
  }

  /**
   * Lấy icon biểu thị trạng thái sắp xếp của cột
   * @param field Tên trường cần kiểm tra
   */
  getSortIcon(field: string): string {
    if (this.filterParams.sortBy !== field) {
      return '⇅';
    }
    return this.filterParams.sortDir === 'asc' ? '▲' : '▼';
  }

  /**
   * Xử lý khi thay đổi tiêu chí sắp xếp từ combobox bộ lọc
   */
  onSortChange(): void {
    this.currentPage = 0;
    this.loadCategories();
  }

  /**
   * Xử lý khi nhấn nút "Tìm Kiếm":
   * Reset về trang đầu tiên (page = 0) và gọi API với các tham số lọc hiện tại
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadCategories();
  }

  /**
   * Xử lý khi nhấn nút "Làm Mới":
   * Xóa sạch toàn bộ các ô lọc về rỗng, reset trang về 0 và gọi API với giá trị mặc định
   */
  onReset(): void {
    this.filterParams = {
      name: '',
      description: '',
      status: '',
      sortBy: 'createdAt',
      sortDir: 'desc'
    };
    this.pageSize = 10;
    this.currentPage = 0;
    this.loadCategories();
    this.toastService.info('Đã đặt lại bộ lọc tìm kiếm và sắp xếp mặc định.');
  }

  /**
   * Xử lý khi người dùng đổi trang từ Pagination Component
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadCategories();
  }

  /**
   * Xử lý khi người dùng thay đổi kích thước trang (5, 10, 20, 50, 100 dòng)
   */
  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 0;
    this.loadCategories();
  }

  /**
   * Mở modal thêm mới thể loại
   */
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentEditingId = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      status: 'UNHIDE'
    });
    this.isModalOpen = true;
  }

  /**
   * Mở modal chỉnh sửa thể loại và điền sẵn dữ liệu hiện có
   */
  openEditModal(category: CategoryResponseDto): void {
    this.isEditMode = true;
    this.currentEditingId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      status: category.status
    });
    this.isModalOpen = true;
  }

  /**
   * Đóng modal và reset trạng thái form
   */
  closeModal(): void {
    this.isModalOpen = false;
    this.categoryForm.reset();
  }

  /**
   * Xử lý lưu form (Thêm mới hoặc Cập nhật)
   */
  onSaveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.categoryForm.value;

    if (this.isEditMode && this.currentEditingId) {
      // Gọi API cập nhật thể loại
      const updateData: CategoryUpdateRequest = {
        name: formValue.name,
        description: formValue.description,
        status: formValue.status
      };

      this.categoryService.updateCategory(this.currentEditingId, updateData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success(`Cập nhật thể loại "${res.data.name}" thành công!`);
          this.loadCategories();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Cập nhật thể loại thất bại!';
          this.toastService.error(msg);
        }
      });
    } else {
      // Gọi API thêm mới thể loại
      const createData: CategoryCreateRequest = {
        name: formValue.name,
        description: formValue.description,
        status: formValue.status
      };

      this.categoryService.createCategory(createData).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success(`Thêm mới thể loại "${res.data.name}" thành công!`);
          this.currentPage = 0; // Về trang đầu để xem bản ghi mới tạo
          this.loadCategories();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Thêm thể loại thất bại!';
          this.toastService.error(msg);
        }
      });
    }
  }

  /**
   * Bật / Tắt trạng thái hiển thị của thể loại (UNHIDE <-> HIDE)
   */
  onToggleStatus(category: CategoryResponseDto): void {
    const nextStatus: DisplayStatus = category.status === 'UNHIDE' ? 'HIDE' : 'UNHIDE';
    const actionLabel = nextStatus === 'UNHIDE' ? 'hiển thị công khai' : 'ẩn đi';

    if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} thể loại "${category.name}" không?`)) {
      return;
    }

    this.categoryService.toggleCategoryStatus(category.id, category.status).subscribe({
      next: (res) => {
        category.status = res.data.status;
        const statusText = res.data.status === 'UNHIDE' ? 'Đang hiển thị' : 'Đang ẩn';
        this.toastService.success(`Thể loại "${category.name}" đã chuyển sang trạng thái: ${statusText}.`);
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể thay đổi trạng thái thể loại!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xóa thể loại khỏi hệ thống (Dành cho ADMIN)
   */
  onDeleteCategory(category: CategoryResponseDto): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa thể loại "${category.name}" không?\nLưu ý: Không thể xóa thể loại nếu đang có sách thuộc thể loại này.`)) {
      return;
    }

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.toastService.success(`Đã xóa thể loại "${category.name}" thành công!`);
        this.loadCategories();
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể xóa thể loại!';
        this.toastService.error(msg);
      }
    });
  }
}
