import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BranchService } from './services/branch.service';
import { BranchFilterRequest, BranchResponseDto, BranchStatus } from '../../../shared/models/branch.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

/**
 * MÀN HÌNH QUẢN LÝ CHI NHÁNH DÀNH CHO ADMIN (SUPER ADMIN PORTAL)
 * - Tìm kiếm, lọc và phân trang danh sách chi nhánh (mặc định createdAt mới nhất lên đầu).
 * - Tự động nạp danh sách BranchStatus từ API public.
 * - Hỗ trợ Thêm mới chi nhánh qua Modal kèm tải ảnh đại diện trước.
 * - Hỗ trợ Cập nhật thông tin chi nhánh qua Modal kèm tải ảnh đại diện trước.
 * - Hỗ trợ Bật/Tắt trạng thái hoạt động trực tiếp trên từng dòng.
 */
@Component({
  selector: 'app-admin-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './admin-branch-list.component.html',
  styleUrl: './admin-branch-list.component.css'
})
export class AdminBranchListComponent implements OnInit {

  private fb = inject(FormBuilder);
  private branchService = inject(BranchService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // Dữ liệu danh sách chi nhánh và phân trang
  public branches: BranchResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Danh sách các trạng thái chi nhánh lấy từ API
  public statusList: BranchStatus[] = [];

  // Đối tượng lưu giá trị các ô lọc trên giao diện
  public filterParams: BranchFilterRequest = {
    code: '',
    name: '',
    address: '',
    phone: '',
    status: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  // Quản lý Modal Thêm mới / Cập nhật
  public isModalOpen: boolean = false;
  public isEditMode: boolean = false;
  public currentEditingId: number | null = null;
  public isSubmitting: boolean = false;

  // Quản lý trạng thái upload và xem trước ảnh chi nhánh
  public imagePreviewUrl: string | null = null;
  public isUploadingImage: boolean = false;

  // Reactive Form cho Thêm mới / Cập nhật
  public branchForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    phone: ['', [Validators.pattern(/^$|^[0-9]{10,11}$/)]],
    status: ['OPEN', [Validators.required]],
    imageUrl: ['']
  });

  get f() {
    return this.branchForm.controls;
  }

  ngOnInit(): void {
    // Bước 1: Nạp danh sách các trạng thái chi nhánh từ API public
    this.loadStatuses();

    // Bước 2: Tải dữ liệu ban đầu
    this.loadBranches();
  }

  /**
   * Gọi API public lấy danh sách enum BranchStatus
   */
  loadStatuses(): void {
    this.branchService.getBranchStatuses().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.statusList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminBranchList] Lỗi tải danh sách trạng thái chi nhánh:', err);
      }
    });
  }

  /**
   * Gọi API lấy danh sách phân trang chi nhánh kèm các tham số lọc hiện tại
   */
  loadBranches(): void {
    this.isLoading = true;

    const request: BranchFilterRequest = {
      code: this.filterParams.code,
      name: this.filterParams.name,
      address: this.filterParams.address,
      phone: this.filterParams.phone,
      status: this.filterParams.status,
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.filterParams.sortBy || 'createdAt',
      sortDir: this.filterParams.sortDir || 'desc'
    };

    this.branchService.getBranchesWithFilter(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.branches = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
          this.currentPage = res.data.number;
          this.pageSize = res.data.size;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AdminBranchList] Lỗi tải danh sách chi nhánh:', err);
        this.toastService.error('Không thể tải danh sách chi nhánh!');
      }
    });
  }

  /**
   * Xử lý sắp xếp dữ liệu khi click vào tiêu đề cột trong bảng
   * @param field Tên trường cần sắp xếp (ví dụ: 'code', 'name', 'address', 'createdAt')
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
    this.loadBranches();
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
    this.loadBranches();
  }

  /**
   * Xử lý khi nhấn nút "Tìm Kiếm":
   * Reset về trang đầu tiên (page = 0) và gọi API với các tham số lọc hiện tại
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadBranches();
  }

  /**
   * Xử lý khi nhấn nút "Làm Mới":
   * Xóa sạch toàn bộ các ô lọc về rỗng, reset trang về 0 và gọi API với giá trị mặc định
   */
  onReset(): void {
    this.filterParams = {
      code: '',
      name: '',
      address: '',
      phone: '',
      status: '',
      sortBy: 'createdAt',
      sortDir: 'desc'
    };
    this.pageSize = 10;
    this.currentPage = 0;
    this.loadBranches();
    this.toastService.info('Đã đặt lại bộ lọc tìm kiếm và sắp xếp mặc định.');
  }

  /**
   * Xử lý khi người dùng đổi trang từ Pagination Component
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadBranches();
  }

  /**
   * Xử lý khi người dùng thay đổi kích thước trang (5, 10, 20, 50, 100 dòng)
   */
  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 0;
    this.loadBranches();
  }

  /**
   * Chuyển đổi đường dẫn ảnh thành URL hoàn chỉnh để hiển thị trên trình duyệt
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
   * Mở modal thêm mới chi nhánh
   */
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentEditingId = null;
    this.imagePreviewUrl = null;
    this.branchForm.reset({
      code: '',
      name: '',
      address: '',
      phone: '',
      status: 'OPEN',
      imageUrl: ''
    });
    this.isModalOpen = true;
  }

  /**
   * Mở modal chỉnh sửa chi nhánh và điền sẵn dữ liệu hiện có
   */
  openEditModal(branch: BranchResponseDto): void {
    this.isEditMode = true;
    this.currentEditingId = branch.id;
    this.imagePreviewUrl = branch.imageUrl ? this.getImageUrl(branch.imageUrl) : null;
    this.branchForm.patchValue({
      code: branch.code,
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      status: branch.status,
      imageUrl: branch.imageUrl || ''
    });
    this.isModalOpen = true;
  }

  /**
   * Đóng modal và reset trạng thái form & ảnh preview
   */
  closeModal(): void {
    this.isModalOpen = false;
    this.imagePreviewUrl = null;
    this.branchForm.reset();
  }

  /**
   * Xử lý khi người dùng chọn file ảnh từ máy:
   * 1. Validate file (định dạng JPG, PNG, WEBP, GIF; kích thước tối đa 10MB)
   * 2. Gọi API upload ảnh trước lên Backend (POST /upload/image?subFolder=branches)
   * 3. Nhận fileUrl / fileKey từ response, hiển thị ảnh xem trước ngay lập tức
   * 4. Gán link vào branchForm control 'imageUrl' để sẵn sàng gửi khi submit
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Kiểm tra định dạng ảnh hợp lệ
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.toastService.error('Chỉ chấp nhận các tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF!');
      input.value = '';
      return;
    }

    // Kiểm tra kích thước tối đa 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toastService.error('Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 10MB)!');
      input.value = '';
      return;
    }

    // Hiển thị trạng thái đang tải lên và gọi API
    this.isUploadingImage = true;
    this.branchService.uploadBranchImage(file).subscribe({
      next: (res) => {
        this.isUploadingImage = false;
        if (res.success && res.data) {
          const imgLink = res.data.fileUrl || res.data.fileKey;
          // Lưu link ảnh vào form
          this.branchForm.patchValue({ imageUrl: imgLink });
          // Hiển thị preview ảnh cho người dùng xem trước
          this.imagePreviewUrl = this.getImageUrl(imgLink);
          this.toastService.success('Tải ảnh chi nhánh lên thành công!');
        }
        input.value = '';
      },
      error: (err) => {
        this.isUploadingImage = false;
        input.value = '';
        console.error('[AdminBranchList] Lỗi tải ảnh lên server:', err);
        const msg = err.error?.message || 'Không thể tải ảnh lên, vui lòng thử lại!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xóa ảnh đã chọn (gỡ bỏ xem trước và reset link ảnh trong form)
   */
  onRemoveImage(): void {
    this.imagePreviewUrl = null;
    this.branchForm.patchValue({ imageUrl: '' });
  }

  /**
   * Xử lý trường hợp ảnh lỗi hoặc không tìm thấy trên bảng dữ liệu
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLElement;
    target.style.display = 'none';
  }

  /**
   * Xử lý lưu form (Thêm mới hoặc Cập nhật)
   */
  onSaveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.branchForm.value;

    if (this.isEditMode && this.currentEditingId) {
      // Gọi API cập nhật chi nhánh
      this.branchService.updateBranch(this.currentEditingId, formValue).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success(`Cập nhật chi nhánh "${res.data.name}" thành công!`);
          this.loadBranches();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Cập nhật chi nhánh thất bại!';
          this.toastService.error(msg);
        }
      });
    } else {
      // Gọi API thêm mới chi nhánh
      this.branchService.createBranch(formValue).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.toastService.success(`Thêm mới chi nhánh "${res.data.name}" thành công!`);
          this.currentPage = 0; // Về trang đầu để xem bản ghi mới tạo
          this.loadBranches();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Thêm chi nhánh thất bại!';
          this.toastService.error(msg);
        }
      });
    }
  }

  /**
   * Bật / Tắt trạng thái hoạt động của chi nhánh (OPEN <-> CLOSED)
   */
  onToggleStatus(branch: BranchResponseDto): void {
    const nextStatus = branch.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const actionLabel = nextStatus === 'OPEN' ? 'mở lại hoạt động' : 'tạm dừng hoạt động';

    if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} chi nhánh "${branch.name}" không?`)) {
      return;
    }

    this.branchService.toggleBranchStatus(branch.id, branch.status).subscribe({
      next: (res) => {
        branch.status = res.data.status;
        const statusText = res.data.status === 'OPEN' ? 'Đang hoạt động' : 'Tạm dừng';
        this.toastService.success(`Chi nhánh "${branch.name}" đã chuyển sang trạng thái: ${statusText}.`);
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể thay đổi trạng thái chi nhánh!';
        this.toastService.error(msg);
      }
    });
  }
}
