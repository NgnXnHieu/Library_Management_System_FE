# Dự Án Frontend Quản Lý Thư Viện (Library Management Frontend)

Ứng dụng Frontend được xây dựng bằng **Angular 18+ (Standalone Components, TypeScript)**, kết nối đồng bộ 100% với Backend **Spring Boot**.

---

## 1. Các Công Nghệ & Kiến Trúc Đã Triển Khai

| Công nghệ | File mẫu triển khai | Vai trò |
| :--- | :--- | :--- |
| **Routing (Lazy Loading)** | `src/app/app.routes.ts` | Điều hướng URL, chỉ tải file code khi người dùng chuyển trang. |
| **Guard** | `src/app/core/guards/auth.guard.ts`<br>`src/app/core/guards/role.guard.ts` | Chặn truy cập khi chưa đăng nhập và kiểm tra phân quyền Role (`ADMIN`, `STAFF`...). |
| **Interceptor** | `src/app/core/interceptors/auth.interceptor.ts`<br>`src/app/core/interceptors/error.interceptor.ts` | Tự động móc `Authorization: Bearer <Token>` vào request và xử lý lỗi 401, 403, 500 toàn cục. |
| **Reactive Form** | `src/app/features/auth/login/login.component.ts` | Quản lý form đăng nhập, bắt lỗi kiểm tra dữ liệu bằng `Validators` tiếng Việt trực quan. |
| **Component & Service** | `src/app/features/borrow-slips/services/borrow-slip.service.ts`<br>`src/app/features/borrow-slips/borrow-slip-list/...` | Tách biệt hoàn toàn tầng gọi API Backend và tầng hiển thị giao diện bảng phân trang. |

---

## 2. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Cài đặt Node.js
Nếu máy tính của bạn chưa có Node.js:
1. Truy cập [https://nodejs.org](https://nodejs.org) và tải bản **LTS** (khuyên dùng Node 20.x hoặc 22.x).
2. Chạy file cài đặt và bấm **Next** cho đến khi hoàn tất.

### Bước 2: Cài đặt dependencies (Thư viện)
Mở PowerShell tại thư mục `library-management-frontend` và chạy lệnh:
```bash
npm install
```

### Bước 3: Khởi động Server phát triển (Development Server)
```bash
npm start
```
Ứng dụng sẽ khởi chạy tại: `http://localhost:4200`

---

## 3. Cấu Trúc Thư Mục Chuẩn

```text
src/
├── environments/               # Cấu hình URL Backend Spring Boot (http://localhost:8080)
└── app/
    ├── core/                   # Tầng cốt lõi: Guards, Interceptors, AuthService
    ├── shared/                 # Tầng dùng chung: Models (ApiResponse, User, BorrowSlip), Navbar
    └── features/               # Tầng nghiệp vụ: Home, Login (Reactive Form), BorrowSlips (Component/Service)
```
