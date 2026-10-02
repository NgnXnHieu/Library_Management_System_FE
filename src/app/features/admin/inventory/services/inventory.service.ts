import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import { InventoryFilterRequest, InventoryResponseDto } from '../../../../shared/models/inventory.model';
import { DisplayStatus } from '../../../../shared/models/category.model';

/**
 * Service giao tiếp API quản lý tồn kho sách (Inventory Service)
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Lấy danh sách tồn kho sách phân trang kèm bộ lọc đa tiêu chí dành cho Admin
   */
  getInventories(filter: InventoryFilterRequest): Observable<ApiResponse<PageResponse<InventoryResponseDto>>> {
    let params = new HttpParams();

    if (filter.branchId !== undefined && filter.branchId !== null) {
      params = params.set('branchId', filter.branchId.toString());
    }
    if (filter.categoryId !== undefined && filter.categoryId !== null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.bookTitle && filter.bookTitle.trim()) {
      params = params.set('bookTitle', filter.bookTitle.trim());
    }
    if (filter.minPrice !== undefined && filter.minPrice !== null) {
      params = params.set('minPrice', filter.minPrice.toString());
    }
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) {
      params = params.set('maxPrice', filter.maxPrice.toString());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.shelfLocation && filter.shelfLocation.trim()) {
      params = params.set('shelfLocation', filter.shelfLocation.trim());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDir) {
      params = params.set('sortDir', filter.sortDir);
    }
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.size !== undefined) {
      params = params.set('size', filter.size.toString());
    }

    return this.http.get<ApiResponse<PageResponse<InventoryResponseDto>>>(
      `${this.baseUrl}/inventories`,
      { params }
    );
  }

  /**
   * Cập nhật thông tin tồn kho (vị trí kệ, trạng thái hiển thị)
   */
  updateInventory(id: number, data: { shelfLocation?: string; status?: DisplayStatus }): Observable<ApiResponse<InventoryResponseDto>> {
    return this.http.put<ApiResponse<InventoryResponseDto>>(
      `${this.baseUrl}/inventories/${id}`,
      data
    );
  }

  /**
   * Thay đổi trạng thái hiển thị của kho (HIDE / UNHIDE)
   */
  changeStatus(id: number, status: DisplayStatus): Observable<ApiResponse<InventoryResponseDto>> {
    let params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<InventoryResponseDto>>(
      `${this.baseUrl}/inventories/${id}/status`,
      {},
      { params }
    );
  }

  /**
   * Nhập thêm số lượng sách vào kho chi nhánh
   */
  importStock(id: number, quantity: number): Observable<ApiResponse<InventoryResponseDto>> {
    return this.http.post<ApiResponse<InventoryResponseDto>>(
      `${this.baseUrl}/inventories/${id}/import`,
      { quantity }
    );
  }

  /**
   * Lấy danh sách tồn kho sách phân trang theo chi nhánh của nhân viên đăng nhập (STAFF, BRANCHMANAGER).
   * Tương ứng với backend: @GetMapping("/inventories/current-branch")
   * 
   * @param filter Bộ lọc tìm kiếm: bookTitle, categoryId, shelfLocation, status, page, size, sortBy, sortDir
   */
  getMyBranchInventories(filter: InventoryFilterRequest): Observable<ApiResponse<PageResponse<InventoryResponseDto>>> {
    let params = new HttpParams();

    if (filter.categoryId !== undefined && filter.categoryId !== null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.bookTitle && filter.bookTitle.trim()) {
      params = params.set('bookTitle', filter.bookTitle.trim());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.shelfLocation && filter.shelfLocation.trim()) {
      params = params.set('shelfLocation', filter.shelfLocation.trim());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDir) {
      params = params.set('sortDir', filter.sortDir);
    }
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.size !== undefined) {
      params = params.set('size', filter.size.toString());
    }

    return this.http.get<ApiResponse<PageResponse<InventoryResponseDto>>>(
      `${this.baseUrl}/inventories/current-branch`,
      { params }
    );
  }
}
