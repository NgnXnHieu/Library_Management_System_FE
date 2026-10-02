import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from './services/inventory.service';
import { BranchService } from '../branches/services/branch.service';
import { CategoryService } from '../categories/services/category.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { InventoryFilterRequest, InventoryResponseDto } from '../../../shared/models/inventory.model';
import { BranchResponseDto } from '../../../shared/models/branch.model';
import { CategoryResponseDto, DisplayStatus } from '../../../shared/models/category.model';
import { environment } from '../../../../environments/environment';

/**
 * MÀN HÌNH QUẢN LÝ KHO SÁCH TOÀN HỆ THỐNG DÀNH CHO ADMIN
 * - Hiển thị danh sách tồn kho sách của tất cả các chi nhánh (InventoryResponseDto).
 * - Bộ lọc đa tiêu chí: Chi nhánh, thể loại, từ khóa tên sách/ISBN, vị trí kệ, trạng thái hiển thị, sắp xếp.
 * - Phân trang linh hoạt với PaginationComponent.
 * - Nút sửa: Cập nhật vị trí kệ sách và trạng thái hiển thị (Modal).
 * - Nút đổi trạng thái: Bật/tắt nhanh trạng thái hiển thị (UNHIDE <-> HIDE).
 * - Nút nhập kho: Nhập thêm số lượng sách vào kho, tự động cộng dồn vào tổng số lượng và khả dụng (Modal).
 */
@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './admin-inventory.component.html',
  styleUrl: './admin-inventory.component.css'
})
export class AdminInventoryComponent implements OnInit {

  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private branchService = inject(BranchService);
  private categoryService = inject(CategoryService);
  private toastService = inject(ToastService);
  private baseUrl = environment.apiUrl;

  // Dữ liệu danh sách tồn kho và phân trang
  public inventories: InventoryResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Danh mục chi nhánh và thể loại sách phục vụ lọc
  public branchList: BranchResponseDto[] = [];
  public categoryList: CategoryResponseDto[] = [];
  public statusOptions: DisplayStatus[] = ['UNHIDE', 'HIDE'];

  // Tham số bộ lọc tìm kiếm
  public filterParams: InventoryFilterRequest = {
    branchId: undefined,
    categoryId: undefined,
    bookTitle: '',
    shelfLocation: '',
    status: undefined,
    sortBy: 'updatedAt',
    sortDir: 'desc'
  };

  // Quản lý Modal Sửa Thông Tin Kho (Vị trí kệ, Trạng thái)
  public isEditModalOpen: boolean = false;
  public editingInventory: InventoryResponseDto | null = null;
  public isUpdating: boolean = false;
  public editForm: FormGroup = this.fb.group({
    shelfLocation: ['', [Validators.maxLength(100)]],
    status: ['UNHIDE', [Validators.required]]
  });

  // Quản lý Modal Nhập Kho
  public isImportModalOpen: boolean = false;
  public importingInventory: InventoryResponseDto | null = null;
  public isImporting: boolean = false;
  public importForm: FormGroup = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadCategories();
    this.loadInventories();
  }

  /**
   * Tải danh sách tất cả các chi nhánh phục vụ dropdown lọc
   */
  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branchList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminInventory] Lỗi tải danh sách chi nhánh:', err);
      }
    });
  }

  /**
   * Tải danh sách tất cả thể loại sách phục vụ dropdown lọc
   */
  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categoryList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminInventory] Lỗi tải danh sách thể loại:', err);
      }
    });
  }

  /**
   * Tải danh sách tồn kho sách phân trang theo bộ lọc
   */
  loadInventories(): void {
    this.isLoading = true;
    const request: InventoryFilterRequest = {
      ...this.filterParams,
      page: this.currentPage,
      size: this.pageSize
    };

    this.inventoryService.getInventories(request).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.inventories = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
          this.totalPages = res.data.totalPages || 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[AdminInventory] Lỗi tải danh sách kho sách:', err);
        const msg = err.error?.message || 'Không thể tải danh sách tồn kho sách!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Thực hiện tìm kiếm và lọc danh sách kho
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadInventories();
  }

  /**
   * Đặt lại toàn bộ bộ lọc về mặc định
   */
  onResetFilter(): void {
    this.filterParams = {
      branchId: undefined,
      categoryId: undefined,
      bookTitle: '',
      shelfLocation: '',
      status: undefined,
      sortBy: 'updatedAt',
      sortDir: 'desc'
    };
    this.currentPage = 0;
    this.loadInventories();
  }

  /**
   * Chuyển trang từ PaginationComponent
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadInventories();
  }

  /**
   * Thay đổi kích thước trang
   */
  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 0;
    this.loadInventories();
  }

  /**
   * Mở modal chỉnh sửa thông tin tồn kho
   */
  openEditModal(inv: InventoryResponseDto): void {
    this.editingInventory = inv;
    this.editForm.patchValue({
      shelfLocation: inv.shelfLocation || '',
      status: inv.status || 'UNHIDE'
    });
    this.isEditModalOpen = true;
  }

  /**
   * Đóng modal chỉnh sửa
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingInventory = null;
    this.editForm.reset();
  }

  /**
   * Submit form chỉnh sửa tồn kho
   */
  onSubmitEdit(): void {
    if (!this.editingInventory) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toastService.warning('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    this.isUpdating = true;
    const formVal = this.editForm.value;
    const payload = {
      shelfLocation: formVal.shelfLocation?.trim() || undefined,
      status: formVal.status as DisplayStatus
    };

    this.inventoryService.updateInventory(this.editingInventory.id, payload).subscribe({
      next: (res) => {
        this.isUpdating = false;
        if (res.success && res.data) {
          this.toastService.success(`Cập nhật thông tin kho sách "${this.editingInventory?.bookTitle}" thành công!`);
          // Cập nhật lại bản ghi trong mảng local
          const index = this.inventories.findIndex(item => item.id === res.data.id);
          if (index !== -1) {
            this.inventories[index] = res.data;
          }
          this.closeEditModal();
        }
      },
      error: (err) => {
        this.isUpdating = false;
        console.error('[AdminInventory] Lỗi cập nhật kho:', err);
        const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin kho!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Mở modal nhập kho sách
   */
  openImportModal(inv: InventoryResponseDto): void {
    this.importingInventory = inv;
    this.importForm.reset({
      quantity: 1
    });
    this.isImportModalOpen = true;
  }

  /**
   * Đóng modal nhập kho sách
   */
  closeImportModal(): void {
    this.isImportModalOpen = false;
    this.importingInventory = null;
    this.importForm.reset();
  }

  /**
   * Submit form nhập kho sách
   */
  onSubmitImport(): void {
    if (!this.importingInventory) return;
    if (this.importForm.invalid) {
      this.importForm.markAllAsTouched();
      this.toastService.warning('Vui lòng nhập số lượng hợp lệ (tối thiểu 1)!');
      return;
    }

    this.isImporting = true;
    const quantity = Number(this.importForm.value.quantity);

    this.inventoryService.importStock(this.importingInventory.id, quantity).subscribe({
      next: (res) => {
        this.isImporting = false;
        if (res.success && res.data) {
          this.toastService.success(`Nhập kho thành công +${quantity} cuốn "${this.importingInventory?.bookTitle}"!`);
          // Cập nhật trực tiếp số lượng trong bảng
          const index = this.inventories.findIndex(item => item.id === res.data.id);
          if (index !== -1) {
            this.inventories[index] = res.data;
          }
          this.closeImportModal();
        }
      },
      error: (err) => {
        this.isImporting = false;
        console.error('[AdminInventory] Lỗi nhập kho:', err);
        const msg = err.error?.message || 'Có lỗi xảy ra khi nhập kho!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Chuyển đổi trạng thái hiển thị nhanh (UNHIDE <-> HIDE)
   */
  onToggleStatus(inv: InventoryResponseDto): void {
    const nextStatus: DisplayStatus = inv.status === 'UNHIDE' ? 'HIDE' : 'UNHIDE';
    const actionText = nextStatus === 'UNHIDE' ? 'hiển thị' : 'ẩn';

    this.inventoryService.changeStatus(inv.id, nextStatus).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          inv.status = nextStatus;
          this.toastService.success(`Đã ${actionText} sách "${inv.bookTitle}" tại chi nhánh "${inv.branchName}"!`);
        }
      },
      error: (err) => {
        console.error('[AdminInventory] Lỗi đổi trạng thái kho:', err);
        const msg = err.error?.message || 'Không thể đổi trạng thái hiển thị kho!';
        this.toastService.error(msg);
      }
    });
  }

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
