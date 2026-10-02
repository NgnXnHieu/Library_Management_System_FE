import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import { BorrowSlipFilterParams, BorrowSlipResponseDto, BorrowStatus } from '../../../../shared/models/borrow-slip.model';

/**
 * SERVICE QUẢN LÝ PHIẾU MƯỢN PHÍA NHÂN VIÊN (STAFF BORROW SLIP SERVICE)
 * Phụ trách gọi các API liên quan đến phiếu mượn của chi nhánh nhân viên:
 * - GET /borrow-slips/current-branch : Lấy danh sách phiếu mượn chi nhánh phân trang & bộ lọc
 * - PUT /borrow-slips/{id}/status : Cập nhật trạng thái phiếu mượn (RETURNED, OVERDUE, CANCELLED, BORROWED)
 * - PUT /borrow-slips/{id}/cancel : Hủy phiếu mượn chi nhánh
 */
@Injectable({
  providedIn: 'root'
})
export class StaffBorrowSlipService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Lấy danh sách phiếu mượn tại chi nhánh của nhân viên đăng nhập kèm bộ lọc và sắp xếp.
   * Tương ứng với backend: @GetMapping("/borrow-slips/current-branch")
   *
   * @param filter Đối tượng lọc: mã phiếu, thông tin độc giả, trạng thái, ngày mượn/trả, phân trang...
   */
  getMyBranchBorrowSlips(filter: BorrowSlipFilterParams): Observable<ApiResponse<PageResponse<BorrowSlipResponseDto>>> {
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
      `${this.baseUrl}/borrow-slips/current-branch`,
      { params }
    );
  }

  /**
   * Cập nhật trạng thái phiếu mượn sách tại chi nhánh của nhân viên.
   * Tương ứng với backend: @PutMapping("/borrow-slips/{id}/status")
   *
   * @param id ID của phiếu mượn cần cập nhật
   * @param status Trạng thái mới (BORROWED, RETURNED, OVERDUE, CANCELLED)
   */
  updateStatus(id: number, status: BorrowStatus): Observable<ApiResponse<BorrowSlipResponseDto>> {
    let params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<BorrowSlipResponseDto>>(
      `${this.baseUrl}/borrow-slips/${id}/status`,
      null,
      { params }
    );
  }

  /**
   * Hủy phiếu mượn sách tại chi nhánh của nhân viên.
   * Tương ứng với backend: @PutMapping("/borrow-slips/{id}/cancel")
   *
   * @param id ID của phiếu mượn cần hủy
   */
  cancelBorrowSlip(id: number): Observable<ApiResponse<BorrowSlipResponseDto>> {
    return this.http.put<ApiResponse<BorrowSlipResponseDto>>(
      `${this.baseUrl}/borrow-slips/${id}/cancel`,
      {}
    );
  }
}
