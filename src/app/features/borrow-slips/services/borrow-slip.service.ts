import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';
import { 
  BorrowSlipCreateRequest, 
  BorrowSlipFilterParams, 
  BorrowSlipResponseDto 
} from '../../../shared/models/borrow-slip.model';

/**
 * TẦNG SERVICE: Chuyên phụ trách giao tiếp HTTP với Spring Boot Backend.
 * Tương ứng với BorrowSlipService bên phía Backend, hoàn toàn độc lập với giao diện UI.
 */
@Injectable({
  providedIn: 'root'
})
export class BorrowSlipService {

  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/borrow-slips`;

  /**
   * Gọi API lấy danh sách toàn bộ phiếu mượn phân trang kèm bộ lọc.
   * Tương ứng với method BorrowSlipController: @GetMapping("/admin/borrow-slips")
   *
   * @param filter Các tham số tìm kiếm, lọc trạng thái, phân trang
   */
  getAllBorrowSlips(filter: BorrowSlipFilterParams): Observable<ApiResponse<PageResponse<BorrowSlipResponseDto>>> {
    // Bước 1: Khởi tạo các Query Parameters gửi lên Backend
    let params = new HttpParams();

    if (filter.page !== undefined) params = params.set('page', filter.page.toString());
    if (filter.size !== undefined) params = params.set('size', filter.size.toString());
    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.paymentStatus) params = params.set('paymentStatus', filter.paymentStatus);
    if (filter.branchId) params = params.set('branchId', filter.branchId.toString());
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);

    // Bước 2: Bắn request GET sang Backend (AuthInterceptor sẽ tự động đính kèm Token)
    return this.http.get<ApiResponse<PageResponse<BorrowSlipResponseDto>>>(this.baseUrl, { params });
  }

  /**
   * Gọi API lấy chi tiết một phiếu mượn theo ID
   *
   * @param id ID của phiếu mượn
   */
  getBorrowSlipById(id: number): Observable<ApiResponse<BorrowSlipResponseDto>> {
    return this.http.get<ApiResponse<BorrowSlipResponseDto>>(`${environment.apiUrl}/borrow-slips/${id}`);
  }

  /**
   * Gọi API tạo mới phiếu mượn sách tại chi nhánh làm việc của nhân viên đang đăng nhập.
   * Tương ứng với method BorrowSlipController: @PostMapping("/borrow-slips")
   *
   * @param data Dữ liệu tạo phiếu mượn gồm customerId, danh sách items, và phương thức thanh toán
   */
  createBorrowSlip(data: BorrowSlipCreateRequest): Observable<ApiResponse<BorrowSlipResponseDto>> {
    return this.http.post<ApiResponse<BorrowSlipResponseDto>>(`${environment.apiUrl}/borrow-slips`, data);
  }
}
