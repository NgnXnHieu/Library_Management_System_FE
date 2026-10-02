import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import {
  CategoryCreateRequest,
  CategoryFilterRequest,
  CategoryResponseDto,
  CategoryUpdateRequest,
  DisplayStatus
} from '../../../../shared/models/category.model';

/**
 * SERVICE QUẢN LÝ THỂ LOẠI SÁCH PHÍA ADMIN (CATEGORY SERVICE)
 * Gọi các API tương ứng từ Backend Spring Boot
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Gọi API public lấy danh sách các giá trị trạng thái hiển thị của thể loại (DisplayStatus: HIDE, UNHIDE)
   */
  getDisplayStatuses(): Observable<ApiResponse<DisplayStatus[]>> {
    return this.http.get<ApiResponse<DisplayStatus[]>>(
      `${this.baseUrl}/public/categories/statuses`
    );
  }

  /**
   * Gọi API Admin lấy danh sách phân trang thể loại kèm các tham số lọc tìm kiếm và sắp xếp
   * @param filter Đối tượng lọc chứa name, description, status, page, size, sortBy, sortDir
   */
  getCategoriesWithFilter(filter: CategoryFilterRequest): Observable<ApiResponse<PageResponse<CategoryResponseDto>>> {
    let params = new HttpParams();

    // Bước 1: Gắn các tham số tìm kiếm khi người dùng nhập dữ liệu
    if (filter.name && filter.name.trim()) {
      params = params.set('name', filter.name.trim());
    }
    if (filter.description && filter.description.trim()) {
      params = params.set('description', filter.description.trim());
    }
    if (filter.status && filter.status.trim()) {
      params = params.set('status', filter.status.trim());
    }

    // Bước 2: Gắn các tham số phân trang và sắp xếp mặc định (createdAt mới nhất lên đầu)
    params = params.set('page', (filter.page ?? 0).toString());
    params = params.set('size', (filter.size ?? 10).toString());
    params = params.set('sortBy', filter.sortBy ?? 'createdAt');
    params = params.set('sortDir', filter.sortDir ?? 'desc');

    return this.http.get<ApiResponse<PageResponse<CategoryResponseDto>>>(
      `${this.baseUrl}/admin/categories`,
      { params }
    );
  }

  /**
   * Gọi API thêm mới thể loại sách (Dành riêng cho ADMIN)
   */
  createCategory(data: CategoryCreateRequest): Observable<ApiResponse<CategoryResponseDto>> {
    return this.http.post<ApiResponse<CategoryResponseDto>>(
      `${this.baseUrl}/categories`,
      data
    );
  }

  /**
   * Gọi API cập nhật thể loại sách (Dành riêng cho ADMIN)
   */
  updateCategory(id: number, data: CategoryUpdateRequest): Observable<ApiResponse<CategoryResponseDto>> {
    return this.http.put<ApiResponse<CategoryResponseDto>>(
      `${this.baseUrl}/categories/${id}`,
      data
    );
  }

  /**
   * Gọi API chuyển đổi trạng thái hiển thị của thể loại (HIDE <-> UNHIDE)
   */
  toggleCategoryStatus(id: number, currentStatus: DisplayStatus): Observable<ApiResponse<CategoryResponseDto>> {
    const nextStatus: DisplayStatus = currentStatus === 'UNHIDE' ? 'HIDE' : 'UNHIDE';
    return this.http.put<ApiResponse<CategoryResponseDto>>(
      `${this.baseUrl}/categories/${id}`,
      { status: nextStatus }
    );
  }

  /**
   * Gọi API công khai lấy toàn bộ danh sách thể loại sách (không phân trang)
   */
  getAllCategories(): Observable<ApiResponse<CategoryResponseDto[]>> {
    return this.http.get<ApiResponse<CategoryResponseDto[]>>(
      `${this.baseUrl}/public/categories`
    );
  }

  /**
   * Gọi API xóa thể loại khỏi hệ thống (Dành riêng cho ADMIN)
   */
  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/categories/${id}`
    );
  }
}
