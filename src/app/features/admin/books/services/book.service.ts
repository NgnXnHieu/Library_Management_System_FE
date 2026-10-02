import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import {
  BookCreateRequest,
  BookFilterRequest,
  BookResponseDto,
  BookUpdateRequest
} from '../../../../shared/models/book.model';
import { DisplayStatus } from '../../../../shared/models/category.model';

/**
 * SERVICE QUẢN LÝ ĐẦU SÁCH PHÍA ADMIN (BOOK SERVICE)
 * Cung cấp các phương thức gọi API Backend Spring Boot cho đầu sách
 */
@Injectable({
  providedIn: 'root'
})
export class BookService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Gọi API public lấy danh sách các trạng thái hiển thị (DisplayStatus: HIDE, UNHIDE)
   */
  getDisplayStatuses(): Observable<ApiResponse<DisplayStatus[]>> {
    return this.http.get<ApiResponse<DisplayStatus[]>>(
      `${this.baseUrl}/public/categories/statuses`
    );
  }

  /**
   * Gọi API Admin lấy danh sách phân trang đầu sách với bộ lọc đa tiêu chí
   * @param filter Bộ lọc đầu sách
   */
  getAdminBooks(filter: BookFilterRequest): Observable<ApiResponse<PageResponse<BookResponseDto>>> {
    let params = new HttpParams();

    // Bước 1: Gán các tham số tìm kiếm dạng văn bản
    if (filter.isbn && filter.isbn.trim()) {
      params = params.set('isbn', filter.isbn.trim());
    }
    if (filter.title && filter.title.trim()) {
      params = params.set('title', filter.title.trim());
    }
    if (filter.author && filter.author.trim()) {
      params = params.set('author', filter.author.trim());
    }
    if (filter.publisher && filter.publisher.trim()) {
      params = params.set('publisher', filter.publisher.trim());
    }

    // Bước 2: Gán tham số thể loại
    if (filter.categoryId != null && filter.categoryId > 0) {
      params = params.set('categoryId', filter.categoryId.toString());
    }

    // Bước 3: Gán các tham số năm xuất bản
    if (filter.publicationYear != null) {
      params = params.set('publicationYear', filter.publicationYear.toString());
    }
    if (filter.publicationYearFrom != null) {
      params = params.set('publicationYearFrom', filter.publicationYearFrom.toString());
    }
    if (filter.publicationYearTo != null) {
      params = params.set('publicationYearTo', filter.publicationYearTo.toString());
    }

    // Bước 4: Gán các tham số khoảng giá
    if (filter.minPrice != null) {
      params = params.set('minPrice', filter.minPrice.toString());
    }
    if (filter.maxPrice != null) {
      params = params.set('maxPrice', filter.maxPrice.toString());
    }
    if (filter.minRentalPrice != null) {
      params = params.set('minRentalPrice', filter.minRentalPrice.toString());
    }
    if (filter.maxRentalPrice != null) {
      params = params.set('maxRentalPrice', filter.maxRentalPrice.toString());
    }

    // Bước 5: Gán trạng thái hiển thị
    if (filter.status && filter.status.trim()) {
      params = params.set('status', filter.status.trim());
    }

    // Bước 6: Gán tham số phân trang và sắp xếp mặc định
    params = params.set('page', (filter.page ?? 0).toString());
    params = params.set('size', (filter.size ?? 10).toString());
    params = params.set('sortBy', filter.sortBy ?? 'createdAt');
    params = params.set('sortDir', filter.sortDir ?? 'desc');

    return this.http.get<ApiResponse<PageResponse<BookResponseDto>>>(
      `${this.baseUrl}/admin/books`,
      { params }
    );
  }

  /**
   * Gọi API thêm mới đầu sách (Dành riêng cho ADMIN)
   */
  createBook(data: BookCreateRequest): Observable<ApiResponse<BookResponseDto>> {
    return this.http.post<ApiResponse<BookResponseDto>>(
      `${this.baseUrl}/books`,
      data
    );
  }

  /**
   * Gọi API cập nhật thông tin đầu sách (Dành riêng cho ADMIN)
   */
  updateBook(id: number, data: BookUpdateRequest): Observable<ApiResponse<BookResponseDto>> {
    return this.http.put<ApiResponse<BookResponseDto>>(
      `${this.baseUrl}/books/${id}`,
      data
    );
  }

  /**
   * Gọi API bật/tắt trạng thái hiển thị của đầu sách (UNHIDE <-> HIDE)
   */
  toggleBookStatus(id: number, currentStatus: DisplayStatus): Observable<ApiResponse<BookResponseDto>> {
    const nextStatus: DisplayStatus = currentStatus === 'UNHIDE' ? 'HIDE' : 'UNHIDE';
    return this.http.put<ApiResponse<BookResponseDto>>(
      `${this.baseUrl}/books/${id}`,
      { status: nextStatus }
    );
  }

  /**
   * Gọi API xóa đầu sách khỏi hệ thống (Dành riêng cho ADMIN)
   */
  deleteBook(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/books/${id}`
    );
  }

  /**
   * Gọi API tải ảnh bìa sách lên hệ thống (lưu trong subFolder: books)
   * Trả về thông tin fileKey và fileUrl để xem trước và lưu kèm khi tạo/sửa sách
   */
  uploadBookCover(file: File): Observable<ApiResponse<{ originalFileName: string; fileKey: string; fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ originalFileName: string; fileKey: string; fileUrl: string }>>(
      `${this.baseUrl}/upload/image?subFolder=books`,
      formData
    );
  }
}
