import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * BẢN ĐỒ ĐỊNH TUYẾN URL HỆ THỐNG - PHÂN TÁCH HOÀN TOÀN THEO TỪNG VAI TRÒ (ROLE)
 * 1. Khách Hàng (Customer Layout)
 * 2. Nhân Viên Quầy (Staff Layout: StaffSidebar + Màn hình Staff)
 * 3. Quản Lý Chi Nhánh (Manager Layout: ManagerSidebar + Màn hình Manager)
 * 4. Quản Trị Viên (Admin Layout: AdminSidebar + Màn hình Admin)
 */
export const routes: Routes = [
  // =========================================================================
  // 1. GIAO DIỆN PHÍA KHÁCH HÀNG (CUSTOMER PORTAL)
  // =========================================================================
  {
    path: '',
    loadComponent: () => import('./layouts/customer-layout/customer-layout.component')
      .then(m => m.CustomerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        title: 'Trang Chủ - Thư Viện Tri Thức'
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
        title: 'Danh Mục Thể Loại Sách'
      },
      {
        path: 'borrow-slips',
        loadComponent: () => import('./features/borrow-slips/borrow-slip-list/borrow-slip-list.component')
          .then(m => m.BorrowSlipListComponent),
        title: 'Tra Cứu Phiếu Mượn'
      }
    ]
  },

  // =========================================================================
  // 2. GIAO DIỆN NHÂN VIÊN QUẦY (STAFF PORTAL)
  // =========================================================================
  {
    path: 'staff',
    loadComponent: () => import('./layouts/staff-layout/staff-layout.component')
      .then(m => m.StaffLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ROLE_STAFF', 'ROLE_BRANCHMANAGER', 'ROLE_ADMIN']
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/staff/dashboard/staff-dashboard.component')
          .then(m => m.StaffDashboardComponent),
        title: 'Bàn Trực Thủ Thư - Nhân Viên Quầy'
      },
      {
        path: 'borrow-slips',
        loadComponent: () => import('./features/staff/borrow-slips/staff-borrow-slip-list.component')
          .then(m => m.StaffBorrowSlipListComponent),
        title: 'Xử Lý Mượn Trả Sách Tại Quầy'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/staff/inventory/staff-inventory.component')
          .then(m => m.StaffInventoryComponent),
        title: 'Kho Sách Chi Nhánh & Lập Phiếu Mượn'
      },
      {
        path: 'patrons',
        loadComponent: () => import('./features/borrow-slips/borrow-slip-list/borrow-slip-list.component')
          .then(m => m.BorrowSlipListComponent),
        title: 'Hồ Sơ Độc Giả Chi Nhánh'
      }
    ]
  },

  // =========================================================================
  // 3. GIAO DIỆN QUẢN LÝ CHI NHÁNH (BRANCH MANAGER PORTAL)
  // =========================================================================
  {
    path: 'manager',
    loadComponent: () => import('./layouts/manager-layout/manager-layout.component')
      .then(m => m.ManagerLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ROLE_BRANCHMANAGER', 'ROLE_ADMIN']
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component')
          .then(m => m.ManagerDashboardComponent),
        title: 'Tổng Quan Chi Nhánh - Quản Lý'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/manager/inventory/manager-inventory.component')
          .then(m => m.ManagerInventoryComponent),
        title: 'Quản Lý Kho Sách Chi Nhánh'
      },
      {
        path: 'borrow-slips',
        loadComponent: () => import('./features/staff/borrow-slips/staff-borrow-slip-list.component')
          .then(m => m.StaffBorrowSlipListComponent),
        title: 'Giám Sát Lưu Thông Sách'
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component')
          .then(m => m.ManagerDashboardComponent),
        title: 'Nhân Sự Chi Nhánh'
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component')
          .then(m => m.ManagerDashboardComponent),
        title: 'Báo Cáo Doanh Thu Phạt'
      }
    ]
  },

  // =========================================================================
  // 4. GIAO DIỆN QUẢN TRỊ VIÊN TOÀN HỆ THỐNG (SUPER ADMIN PORTAL)
  // =========================================================================
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ROLE_ADMIN']
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component')
          .then(m => m.AdminDashboardComponent),
        title: 'Bảng Điều Khiển Chuỗi - Super Admin'
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/admin/inventory/admin-inventory.component')
          .then(m => m.AdminInventoryComponent),
        title: 'Kho Sách Toàn Quốc & Điều Chuyển'
      },
      {
        path: 'borrow-slips',
        loadComponent: () => import('./features/admin/borrow-slips/admin-borrow-slip-list.component')
          .then(m => m.AdminBorrowSlipListComponent),
        title: 'Quản Lý Phiếu Mượn Toàn Quốc - Super Admin'
      },
      {
        path: 'branches',
        loadComponent: () => import('./features/admin/branches/admin-branch-list.component')
          .then(m => m.AdminBranchListComponent),
        title: 'Quản Lý Chi Nhánh Toàn Hệ Thống'
      },
      {
        path: 'books',
        loadComponent: () => import('./features/admin/books/admin-book-list.component')
          .then(m => m.AdminBookListComponent),
        title: 'Quản Lý Đầu Sách Toàn Hệ Thống'
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/categories/admin-category-list.component')
          .then(m => m.AdminCategoryListComponent),
        title: 'Quản Lý Danh Mục Thể Loại'
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-user-list.component')
          .then(m => m.AdminUserListComponent),
        title: 'Quản Lý Tài Khoản & Phân Quyền'
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component')
          .then(m => m.AdminDashboardComponent),
        title: 'Báo Cáo Tổng Hợp Toàn Quốc'
      }
    ]
  },

  // =========================================================================
  // 5. MÀN HÌNH ĐĂNG NHẬP
  // =========================================================================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Đăng Nhập Hệ Thống'
  },

  // =========================================================================
  // 6. TRANG 404 NOT FOUND
  // =========================================================================
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 - Không Tìm Thấy Trang'
  }
];
