import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response.model';
import { CategorySimpleDto } from '../../shared/models/category.model';

/**
 * Service quản lý các yêu cầu liên quan đến Thể loại sách (Category).
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private http = inject(HttpClient);

  /**
   * Lấy danh sách thể loại đang hiển thị công khai (status = UNHIDE) cho khách hàng.
   * Endpoint công khai: GET /public/categories/active
   * Phục vụ hiển thị trên Menu Dropdown và Bộ lọc tìm kiếm.
   */
  getActiveCategories(): Observable<ApiResponse<CategorySimpleDto[]>> {
    return this.http.get<ApiResponse<CategorySimpleDto[]>>(
      `${environment.apiUrl}/public/categories/active`
    );
  }
}
