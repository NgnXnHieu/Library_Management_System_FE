import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../../shared/models/api-response.model';
import { BookFilterRequest, BookResponseDto, BookDetailCustomerResponseDto } from '../../shared/models/book.model';

/**
 * Service quản lý các yêu cầu liên quan đến Sách (Book).
 */
@Injectable({
  providedIn: 'root'
})
export class BookService {

  private http = inject(HttpClient);

  /**
   * Lấy danh sách đầu sách công khai kèm bộ lọc, tìm kiếm, sắp xếp và phân trang.
   * Endpoint công khai: GET /public/books
   *
   * @param filter Bộ lọc tìm kiếm sách (categoryId, keyword/title, minPrice, maxPrice, sortBy, sortDir, page, size...)
   */
  getPublicBooks(filter: BookFilterRequest): Observable<ApiResponse<PageResponse<BookResponseDto>>> {
    let params = new HttpParams();

    if (filter.categoryId != null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter.title && filter.title.trim()) {
      params = params.set('title', filter.title.trim());
    }
    if (filter.author && filter.author.trim()) {
      params = params.set('author', filter.author.trim());
    }
    if (filter.isbn && filter.isbn.trim()) {
      params = params.set('isbn', filter.isbn.trim());
    }
    if (filter.minPrice != null && filter.minPrice >= 0) {
      params = params.set('minPrice', filter.minPrice.toString());
    }
    if (filter.maxPrice != null && filter.maxPrice >= 0) {
      params = params.set('maxPrice', filter.maxPrice.toString());
    }
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDir) {
      params = params.set('sortDir', filter.sortDir);
    }
    if (filter.page != null) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.size != null) {
      params = params.set('size', filter.size.toString());
    }

    return this.http.get<ApiResponse<PageResponse<BookResponseDto>>>(
      `${environment.apiUrl}/public/books`,
      { params }
    );
  }

  /**
   * Lấy thông tin chi tiết một đầu sách kèm tồn kho chi nhánh cho khách hàng.
   * Endpoint công khai: GET /public/books/{bookId}
   *
   * @param bookId ID của sách
   * @param branchId ID của chi nhánh (tùy chọn)
   */
  getPublicBookDetail(bookId: number, branchId?: number): Observable<ApiResponse<BookDetailCustomerResponseDto>> {
    let params = new HttpParams();
    if (branchId != null) {
      params = params.set('branchId', branchId.toString());
    }
    return this.http.get<ApiResponse<BookDetailCustomerResponseDto>>(
      `${environment.apiUrl}/public/books/${bookId}`,
      { params }
    );
  }
}
