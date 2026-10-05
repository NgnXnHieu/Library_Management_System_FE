import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../admin/users/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import {
  AccountStatus,
  CustomerFilterRequest,
  UserResponseDto,
  UserUpdateRequest
} from '../../../shared/models/user.model';
import { environment } from '../../../../environments/environment';

/**
 * COMPONENT QUẢN LÝ / HỒ SƠ KHÁCH HÀNG (CUSTOMER LIST COMPONENT)
 * - Tái sử dụng linh hoạt cho cả 2 vai trò:
 *   1. Phía STAFF: Xem hồ sơ khách hàng, tra cứu thông tin cá nhân và có nút "Xem phiếu mượn"
 *      chuyển sang /staff/borrow-slips?customerSearch=...
 *   2. Phía ADMIN: Quản lý khách hàng toàn hệ thống, có nút "Xem phiếu mượn" chuyển sang
 *      /admin/borrow-slips?customerSearch=... VÀ nút "Chỉnh sửa" mở modal cập nhật thông tin.
 */
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {

  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  // Nhận diện vai trò và ngữ cảnh hiển thị
  public isAdminContext: boolean = false;

  // Dữ liệu danh sách khách hàng và phân trang
  public customers: UserResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Bộ lọc tìm kiếm
  public filterParams: {
    username: string;
    fullName: string;
    phone: string;
    email: string;
    status: AccountStatus | '';
    sortBy: string;
    sortDir: 'asc' | 'desc';
  } = {
    username: '',
    fullName: '',
    phone: '',
    email: '',
    status: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  // State Modal chỉnh sửa thông tin khách hàng (Dành riêng cho ADMIN)
  public showEditModal: boolean = false;
  public isSubmittingEdit: boolean = false;
  public editingCustomerId: number | null = null;
  public editFormData: UserUpdateRequest = {
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: '',
    status: 'ACTIVE'
  };

  ngOnInit(): void {
    // Bước 1: Kiểm tra ngữ cảnh truy cập (Admin hay Staff)
    this.checkContext();

    // Bước 2: Tải danh sách khách hàng theo bộ lọc và phân trang
    this.loadCustomers();
  }

  /**
   * Kiểm tra URL và quyền của tài khoản hiện tại
   */
  private checkContext(): void {
    const currentUrl = this.router.url;
    this.isAdminContext = currentUrl.startsWith('/admin') || this.authService.hasAnyRole(['ROLE_ADMIN']);
  }

  /**
   * Tải danh sách phân trang khách hàng từ Backend API
   */
  loadCustomers(): void {
    this.isLoading = true;

    const filter: CustomerFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      username: this.filterParams.username.trim() || undefined,
      fullName: this.filterParams.fullName.trim() || undefined,
      phone: this.filterParams.phone.trim() || undefined,
      email: this.filterParams.email.trim() || undefined,
      status: this.filterParams.status ? (this.filterParams.status as AccountStatus) : undefined,
      sortBy: this.filterParams.sortBy,
      sortDir: this.filterParams.sortDir
    };

    this.userService.getCustomersPage(filter).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.customers = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Không thể tải danh sách khách hàng!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xử lý tìm kiếm khi người dùng bấm nút Tìm kiếm hoặc Enter
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  /**
   * Đặt lại bộ lọc về mặc định
   */
  onResetFilters(): void {
    this.filterParams = {
      username: '',
      fullName: '',
      phone: '',
      email: '',
      status: '',
      sortBy: 'createdAt',
      sortDir: 'desc'
    };
    this.currentPage = 0;
    this.loadCustomers();
  }

  /**
   * Đổi trang
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCustomers();
  }

  /**
   * Đổi số dòng mỗi trang
   */
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadCustomers();
  }

  // =========================================================================
  // THAO TÁC NGHIỆP VỤ: XEM PHIẾU MƯỢN & CHỈNH SỬA
  // =========================================================================

  /**
   * Bấm nút "Xem phiếu mượn": Điều hướng sang trang xem phiếu mượn riêng của khách hàng này.
   * Truyền thông tin khách hàng qua queryParams để hiển thị card tóm tắt trên trang chi tiết.
   */
  viewBorrowSlips(customer: UserResponseDto): void {
    const targetRoute = this.isAdminContext
      ? ['/admin/customers', customer.userId, 'borrow-slips']
      : ['/staff/patrons', customer.userId, 'borrow-slips'];

    this.router.navigate(targetRoute, {
      queryParams: {
        name: customer.fullName,
        username: customer.username,
        phone: customer.phone,
        email: customer.email
      }
    });
  }

  /**
   * Mở Modal chỉnh sửa thông tin khách hàng (Dành riêng cho ADMIN)
   */
  openEditModal(customer: UserResponseDto): void {
    this.editingCustomerId = customer.userId;
    this.editFormData = {
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      dateOfBirth: customer.dateOfBirth || '',
      address: customer.address || '',
      status: customer.status || 'ACTIVE'
    };
    this.showEditModal = true;
  }

  /**
   * Đóng Modal chỉnh sửa
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingCustomerId = null;
  }

  /**
   * Xác nhận lưu thông tin cập nhật khách hàng (gọi API PUT /users/{id})
   */
  submitUpdateCustomer(): void {
    if (!this.editingCustomerId) return;

    if (!this.editFormData.fullName || !this.editFormData.fullName.trim()) {
      this.toastService.warning('Họ và tên khách hàng không được để trống!');
      return;
    }

    this.isSubmittingEdit = true;

    this.userService.updateUser(this.editingCustomerId, this.editFormData).subscribe({
      next: (res) => {
        this.isSubmittingEdit = false;
        this.closeEditModal();
        this.toastService.success('Cập nhật thông tin khách hàng thành công!');
        this.loadCustomers();
      },
      error: (err) => {
        this.isSubmittingEdit = false;
        const msg = err.error?.message || 'Không thể cập nhật thông tin khách hàng!';
        this.toastService.error(msg);
      }
    });
  }

  // =========================================================================
  // TIỆN ÍCH HÌNH ẢNH & THỐNG KÊ
  // =========================================================================

  get activeCountOnPage(): number {
    return this.customers.filter(c => c.status === 'ACTIVE').length;
  }

  get lockedCountOnPage(): number {
    return this.customers.filter(c => c.status === 'LOCKED' || c.status === 'INACTIVE').length;
  }

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
