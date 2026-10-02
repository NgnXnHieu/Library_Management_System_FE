import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from './services/user.service';
import { BranchService } from '../branches/services/branch.service';
import {
  AccountCreateRequest,
  AccountStatus,
  UserAdminFilterRequest,
  UserResponseDto,
  UserUpdateRequest
} from '../../../shared/models/user.model';
import { BranchResponseDto } from '../../../shared/models/branch.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';

/**
 * MÀN HÌNH QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG DÀNH CHO ADMIN
 * - Tìm kiếm đa năng theo Username, Email, Số điện thoại.
 * - Lọc theo Vai trò (ADMIN, BRANCHMANAGER, STAFF, CUSTOMER), Chi nhánh, Trạng thái (ACTIVE, INACTIVE, LOCKED).
 * - Sắp xếp cột linh hoạt, mặc định ngày tạo mới nhất lên đầu.
 * - Phân trang tái sử dụng với PaginationComponent.
 * - Tạo mới tài khoản (POST /accounts/admin).
 * - Cập nhật thông tin tài khoản (PUT /users/{id}) tuân thủ ma trận phân quyền:
 *   + Không sửa tài khoản Admin.
 *   + Không đổi vai trò của tài khoản Customer.
 * - Đổi nhanh trạng thái tài khoản (ACTIVE, INACTIVE, LOCKED).
 */
@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './admin-user-list.component.html',
  styleUrl: './admin-user-list.component.css'
})
export class AdminUserListComponent implements OnInit {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private branchService = inject(BranchService);
  private toastService = inject(ToastService);

  // Danh sách dữ liệu người dùng và phân trang
  public users: UserResponseDto[] = [];
  public totalElements: number = 0;
  public totalPages: number = 0;
  public currentPage: number = 0;
  public pageSize: number = 10;
  public isLoading: boolean = false;

  // Danh sách chi nhánh nạp từ API phục vụ lọc và chọn trong modal
  public branchList: BranchResponseDto[] = [];

  // Danh sách vai trò và trạng thái
  public roleOptions = [
    { code: 'ADMIN', name: '👑 Quản Trị Viên (ADMIN)' },
    { code: 'BRANCHMANAGER', name: '🏛️ Quản Lý Chi Nhánh (BRANCHMANAGER)' },
    { code: 'STAFF', name: '💼 Nhân Viên (STAFF)' },
    { code: 'CUSTOMER', name: '👤 Khách Hàng / Độc Giả (CUSTOMER)' }
  ];

  /**
   * Danh sách vai trò hiển thị trong form cập nhật:
   * - Nếu tài khoản đang chỉnh sửa là CUSTOMER: chỉ hiển thị CUSTOMER (select bị disabled).
   * - Nếu tài khoản có vai trò khác CUSTOMER: ẩn role CUSTOMER và ADMIN, chỉ cho phép chọn giữa các vai trò quản lý / nhân viên.
   */
  get availableEditRoles(): { code: string; name: string }[] {
    if (this.isCustomerRole) {
      return this.roleOptions.filter(r => r.code === 'CUSTOMER');
    }
    return this.roleOptions.filter(r => r.code !== 'ADMIN' && r.code !== 'CUSTOMER');
  }

  public statusOptions: { value: AccountStatus; label: string }[] = [
    { value: 'ACTIVE', label: '🟢 Hoạt động (ACTIVE)' },
    { value: 'INACTIVE', label: '⚪ Chưa kích hoạt (INACTIVE)' },
    { value: 'LOCKED', label: '🔴 Đang bị khóa (LOCKED)' }
  ];

  // Tham số bộ lọc tìm kiếm
  public filterParams: UserAdminFilterRequest = {
    searchName: '',
    role: '',
    branchName: '',
    statuses: [],
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  // Trạng thái được chọn trong dropdown lọc trạng thái (hỗ trợ chọn 1 hoặc tất cả)
  public selectedFilterStatus: string = '';

  // Quản lý Modal Tạo Tài Khoản
  public isCreateModalOpen: boolean = false;
  public isCreating: boolean = false;
  public createForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(50)]],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/)
      ]
    ],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    role: ['STAFF', [Validators.required]],
    status: ['ACTIVE', [Validators.required]],
    branchId: [null, [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]]
  });

  // Quản lý Modal Cập Nhật Tài Khoản
  public isEditModalOpen: boolean = false;
  public isUpdating: boolean = false;
  public currentEditingUser: UserResponseDto | null = null;
  public isCustomerRole: boolean = false;
  public editForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
    dateOfBirth: [''],
    address: [''],
    role: [''],
    branchId: [null],
    status: ['ACTIVE', [Validators.required]]
  });

  get cf() {
    return this.createForm.controls;
  }

  get ef() {
    return this.editForm.controls;
  }

  ngOnInit(): void {
    // Bước 1: Nạp danh sách chi nhánh
    this.loadBranches();

    // Bước 2: Tải danh sách người dùng trang đầu tiên
    this.loadUsers();
  }

  /**
   * Tải toàn bộ danh sách chi nhánh từ Backend để đổ vào các ô chọn (combobox)
   */
  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branchList = res.data;
        }
      },
      error: (err) => {
        console.error('[AdminUserList] Lỗi tải danh sách chi nhánh:', err);
      }
    });
  }

  /**
   * Tải danh sách người dùng phân trang theo bộ lọc hiện tại
   */
  loadUsers(): void {
    this.isLoading = true;

    // Chuẩn hóa statuses theo lựa chọn
    const statusesPayload: AccountStatus[] = this.selectedFilterStatus
      ? [this.selectedFilterStatus as AccountStatus]
      : [];

    const requestPayload: UserAdminFilterRequest = {
      ...this.filterParams,
      statuses: statusesPayload.length > 0 ? statusesPayload : undefined,
      page: this.currentPage,
      size: this.pageSize
    };

    this.userService.getAdminUsers(requestPayload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.users = res.data.content;
          this.totalElements = res.data.totalElements;
          this.totalPages = res.data.totalPages;
        } else {
          this.users = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.users = [];
        this.totalElements = 0;
        this.totalPages = 0;
        console.error('[AdminUserList] Lỗi tải danh sách người dùng:', err);
        const msg = err.error?.message || 'Không thể tải danh sách tài khoản, vui lòng thử lại!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Xử lý sắp xếp khi người dùng nhấn vào tiêu đề cột
   */
  onSort(field: string): void {
    if (this.filterParams.sortBy === field) {
      this.filterParams.sortDir = this.filterParams.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filterParams.sortBy = field;
      this.filterParams.sortDir = 'desc';
    }
    this.currentPage = 0;
    this.loadUsers();
  }

  /**
   * Xử lý khi đổi lựa chọn sắp xếp trong dropdown
   */
  onSortChange(): void {
    this.currentPage = 0;
    this.loadUsers();
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
   * Nhấn nút Tìm Kiếm
   */
  onSearch(): void {
    this.currentPage = 0;
    this.loadUsers();
  }

  /**
   * Nhấn nút Làm Mới: đặt lại toàn bộ tham số bộ lọc về ban đầu
   */
  onReset(): void {
    this.filterParams = {
      searchName: '',
      role: '',
      branchName: '',
      statuses: [],
      sortBy: 'createdAt',
      sortDir: 'desc'
    };
    this.selectedFilterStatus = '';
    this.pageSize = 10;
    this.currentPage = 0;
    this.loadUsers();
    this.toastService.info('Đã đặt lại bộ lọc tìm kiếm và sắp xếp mặc định.');
  }

  /**
   * Đổi trang từ PaginationComponent
   */
  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadUsers();
  }

  /**
   * Đổi kích thước trang (5, 10, 20, 50, 100)
   */
  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 0;
    this.loadUsers();
  }

  /**
   * Kiểm tra xem Admin có được phép sửa tài khoản này không.
   * Quy tắc: Admin không được sửa tài khoản có role là ADMIN.
   */
  canEditUser(user: UserResponseDto): boolean {
    const roleCode = (user.role || '').replace('ROLE_', '').toUpperCase();
    return roleCode !== 'ADMIN';
  }

  /**
   * Mở modal tạo mới tài khoản
   */
  openCreateModal(): void {
    this.createForm.reset({
      username: '',
      password: '',
      fullName: '',
      role: 'STAFF',
      status: 'ACTIVE',
      branchId: this.branchList.length > 0 ? this.branchList[0].id : null,
      email: '',
      phone: ''
    });
    this.isCreateModalOpen = true;
  }

  /**
   * Đóng modal tạo tài khoản
   */
  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.createForm.reset();
  }

  /**
   * Submit form tạo tài khoản mới
   */
  onSubmitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.toastService.warning('Vui lòng kiểm tra lại các trường bắt buộc và định dạng mật khẩu!');
      return;
    }

    this.isCreating = true;
    const formVal = this.createForm.value;

    const payload: AccountCreateRequest = {
      username: formVal.username.trim(),
      password: formVal.password,
      fullName: formVal.fullName.trim(),
      role: formVal.role,
      status: formVal.status,
      branchId: Number(formVal.branchId),
      email: formVal.email.trim(),
      phone: formVal.phone.trim()
    };

    this.userService.createAccountByAdmin(payload).subscribe({
      next: (res) => {
        this.isCreating = false;
        if (res.success) {
          this.toastService.success(`Tạo tài khoản "${payload.username}" thành công!`);
          this.closeCreateModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.isCreating = false;
        console.error('[AdminUserList] Lỗi tạo tài khoản:', err);
        const msg = err.error?.message || 'Có lỗi xảy ra khi tạo tài khoản, vui lòng thử lại!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Mở modal cập nhật thông tin tài khoản
   */
  openEditModal(user: UserResponseDto): void {
    if (!this.canEditUser(user)) {
      this.toastService.warning('Không được phép thay đổi thông tin của tài khoản Quản trị viên (Admin)!');
      return;
    }

    this.currentEditingUser = user;
    const cleanRole = (user.role || '').replace('ROLE_', '').toUpperCase();
    this.isCustomerRole = cleanRole === 'CUSTOMER';

    this.editForm.patchValue({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      role: cleanRole,
      branchId: user.branchId || null,
      status: user.status
    });

    this.isEditModalOpen = true;
  }

  /**
   * Đóng modal cập nhật tài khoản
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.currentEditingUser = null;
    this.editForm.reset();
  }

  /**
   * Submit form cập nhật tài khoản
   */
  onSubmitEdit(): void {
    if (!this.currentEditingUser) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toastService.warning('Vui lòng kiểm tra lại các trường bắt buộc!');
      return;
    }

    this.isUpdating = true;
    const formVal = this.editForm.value;

    const payload: UserUpdateRequest = {
      fullName: formVal.fullName?.trim(),
      email: formVal.email?.trim(),
      phone: formVal.phone?.trim(),
      dateOfBirth: formVal.dateOfBirth || undefined,
      address: formVal.address?.trim() || undefined,
      role: this.isCustomerRole ? undefined : formVal.role,
      branchId: formVal.branchId ? Number(formVal.branchId) : undefined,
      status: formVal.status
    };

    this.userService.updateUser(this.currentEditingUser.userId, payload).subscribe({
      next: (res) => {
        this.isUpdating = false;
        if (res.success) {
          this.toastService.success(`Cập nhật thông tin tài khoản "${this.currentEditingUser?.username}" thành công!`);
          this.closeEditModal();
          this.loadUsers();
        }
      },
      error: (err) => {
        this.isUpdating = false;
        console.error('[AdminUserList] Lỗi cập nhật tài khoản:', err);
        const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật tài khoản!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Thay đổi trạng thái tài khoản nhanh chóng (Ví dụ Khóa / Mở khóa)
   */
  onChangeStatusQuick(user: UserResponseDto, newStatus: AccountStatus): void {
    if (!this.canEditUser(user)) {
      this.toastService.warning('Không được phép thay đổi trạng thái của tài khoản Quản trị viên!');
      return;
    }

    const actionName = newStatus === 'ACTIVE' ? 'Kích hoạt' : (newStatus === 'LOCKED' ? 'Khóa' : 'Tạm dừng');
    this.userService.changeUserStatus(user.userId, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          user.status = newStatus;
          this.toastService.success(`Đã ${actionName} tài khoản "${user.username}"!`);
        }
      },
      error: (err) => {
        console.error('[AdminUserList] Lỗi đổi trạng thái:', err);
        const msg = err.error?.message || 'Không thể đổi trạng thái tài khoản!';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Class màu sắc tương ứng cho từng vai trò
   */
  getRoleBadgeClass(role: string): string {
    const r = (role || '').replace('ROLE_', '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return 'badge-role-admin';
      case 'BRANCHMANAGER':
        return 'badge-role-manager';
      case 'STAFF':
        return 'badge-role-staff';
      case 'CUSTOMER':
        return 'badge-role-customer';
      default:
        return 'badge-role-default';
    }
  }

  /**
   * Tên hiển thị thân thiện cho từng vai trò
   */
  getRoleDisplayName(role: string): string {
    const r = (role || '').replace('ROLE_', '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return '👑 Quản Trị Viên';
      case 'BRANCHMANAGER':
        return '🏛️ Quản Lý Chi Nhánh';
      case 'STAFF':
        return '💼 Nhân Viên';
      case 'CUSTOMER':
        return '👤 Khách Hàng';
      default:
        return role;
    }
  }

  /**
   * Class màu sắc cho từng trạng thái tài khoản
   */
  getStatusBadgeClass(status: AccountStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-status-active';
      case 'INACTIVE':
        return 'badge-status-inactive';
      case 'LOCKED':
        return 'badge-status-locked';
      default:
        return '';
    }
  }

  /**
   * Tên hiển thị cho trạng thái
   */
  getStatusDisplayName(status: AccountStatus): string {
    switch (status) {
      case 'ACTIVE':
        return '🟢 Hoạt động';
      case 'INACTIVE':
        return '⚪ Chưa kích hoạt';
      case 'LOCKED':
        return '🔴 Đã khóa';
      default:
        return status;
    }
  }
}
