import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import { BorrowSlipFilterParams, BorrowSlipResponseDto, BorrowStatus } from '../../../../shared/models/borrow-slip.model';

/**
 * SERVICE QUẢN LÝ PHIẾU MƯỢN PHÍA ADMIN (ADMIN BORROW SLIP SERVICE)
 * Phụ trách gọi các API liên quan đến phiếu mượn toàn hệ thống dành cho Super Admin:
 * - GET /admin/borrow-slips : Lấy danh sách phân trang kèm bộ lọc chi tiết
 * - PUT /admin/borrow-slips/{id}/status : Cập nhật trạng thái phiếu mượn
 */
@Injectable({
  providedIn: 'root'
})
export class AdminBorrowSlipService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Gọi API lấy danh sách toàn bộ phiếu mượn phân trang kèm bộ lọc và sắp xếp.
   * Tương ứng với backend: @GetMapping("/admin/borrow-slips")
   *
   * @param filter Đối tượng chứa các tiêu chí lọc: mã phiếu, thông tin khách hàng, chi nhánh, trạng thái, ngày mượn/trả, phân trang...
   */
  getBorrowSlips(filter: BorrowSlipFilterParams): Observable<ApiResponse<PageResponse<BorrowSlipResponseDto>>> {
    let params = new HttpParams();

    // Bước 1: Gán các tham số phân trang
    if (filter.page !== undefined && filter.page !== null) {
      params = params.set('page', filter.page.toString());
    }
    if (filter.size !== undefined && filter.size !== null) {
      params = params.set('size', filter.size.toString());
    }

    // Bước 2: Gán các tham số tìm kiếm và lọc dữ liệu
    if (filter.borrowCode && filter.borrowCode.trim()) {
      params = params.set('borrowCode', filter.borrowCode.trim());
    }
    if (filter.customerSearch && filter.customerSearch.trim()) {
      params = params.set('customerSearch', filter.customerSearch.trim());
    }
    if (filter.customerId !== undefined && filter.customerId !== null) {
      params = params.set('customerId', filter.customerId.toString());
    }
    if (filter.branchId !== undefined && filter.branchId !== null) {
      params = params.set('branchId', filter.branchId.toString());
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.paymentStatus) {
      params = params.set('paymentStatus', filter.paymentStatus);
    }
    if (filter.fromBorrowedAt) {
      params = params.set('fromBorrowedAt', filter.fromBorrowedAt);
    }
    if (filter.toBorrowedAt) {
      params = params.set('toBorrowedAt', filter.toBorrowedAt);
    }
    if (filter.fromReturnedAt) {
      params = params.set('fromReturnedAt', filter.fromReturnedAt);
    }
    if (filter.toReturnedAt) {
      params = params.set('toReturnedAt', filter.toReturnedAt);
    }

    // Bước 3: Gán các tham số sắp xếp
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter.sortDir) {
      params = params.set('sortDir', filter.sortDir);
    }

    // Bước 4: Thực hiện gửi request GET lên Backend
    return this.http.get<ApiResponse<PageResponse<BorrowSlipResponseDto>>>(
      `${this.baseUrl}/admin/borrow-slips`,
      { params }
    );
  }

  /**
   * Gọi API cập nhật trạng thái của phiếu mượn sách.
   * Tương ứng với backend: @PutMapping("/admin/borrow-slips/{id}/status")
   *
   * @param id ID của phiếu mượn cần cập nhật
   * @param status Trạng thái mới (BORROWED, RETURNED, OVERDUE, CANCELLED)
   */
  updateStatus(id: number, status: BorrowStatus): Observable<ApiResponse<BorrowSlipResponseDto>> {
    let params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<BorrowSlipResponseDto>>(
      `${this.baseUrl}/admin/borrow-slips/${id}/status`,
      null,
      { params }
    );
  }
}
