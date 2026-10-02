import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, PageResponse } from '../../../../shared/models/api-response.model';
import { 
  BranchCreateRequest, 
  BranchFilterRequest, 
  BranchResponseDto, 
  BranchStatus, 
  BranchUpdateRequest 
} from '../../../../shared/models/branch.model';

/**
 * SERVICE QUẢN LÝ CHI NHÁNH PHÍA ADMIN (BRANCH SERVICE)
 * Gọi các API tương ứng từ Backend Spring Boot
 */
@Injectable({
  providedIn: 'root'
})
export class BranchService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Gọi API public lấy danh sách các giá trị trạng thái hoạt động của chi nhánh (BranchStatus)
   */
  getBranchStatuses(): Observable<ApiResponse<BranchStatus[]>> {
    return this.http.get<ApiResponse<BranchStatus[]>>(
      `${this.baseUrl}/public/branches/statuses`
    );
  }

  /**
   * Gọi API Admin lấy danh sách phân trang chi nhánh kèm các tham số lọc tìm kiếm và sắp xếp
   * @param filter Đối tượng lọc chứa code, name, address, phone, status, page, size, sortBy, sortDir
   */
  getBranchesWithFilter(filter: BranchFilterRequest): Observable<ApiResponse<PageResponse<BranchResponseDto>>> {
    let params = new HttpParams();

    // BƯỚC 1: Chỉ gắn các tham số lọc khi người dùng thực sự nhập giá trị
    if (filter.code && filter.code.trim()) {
      params = params.set('code', filter.code.trim());
    }
    if (filter.name && filter.name.trim()) {
      params = params.set('name', filter.name.trim());
    }
    if (filter.address && filter.address.trim()) {
      params = params.set('address', filter.address.trim());
    }
    if (filter.phone && filter.phone.trim()) {
      params = params.set('phone', filter.phone.trim());
    }
    if (filter.status && filter.status.trim()) {
      params = params.set('status', filter.status.trim());
    }

    // BƯỚC 2: Gắn các tham số phân trang và sắp xếp mặc định (createdAt mới nhất lên đầu)
    params = params.set('page', (filter.page ?? 0).toString());
    params = params.set('size', (filter.size ?? 10).toString());
    params = params.set('sortBy', filter.sortBy ?? 'createdAt');
    params = params.set('sortDir', filter.sortDir ?? 'desc');

    return this.http.get<ApiResponse<PageResponse<BranchResponseDto>>>(
      `${this.baseUrl}/admin/branches`,
      { params }
    );
  }

  /**
   * Gọi API thêm mới chi nhánh (Dành riêng cho ADMIN)
   */
  createBranch(data: BranchCreateRequest): Observable<ApiResponse<BranchResponseDto>> {
    return this.http.post<ApiResponse<BranchResponseDto>>(
      `${this.baseUrl}/branches`,
      data
    );
  }

  /**
   * Gọi API cập nhật chi nhánh (Dành riêng cho ADMIN)
   */
  updateBranch(id: number, data: BranchUpdateRequest): Observable<ApiResponse<BranchResponseDto>> {
    return this.http.put<ApiResponse<BranchResponseDto>>(
      `${this.baseUrl}/branches/${id}`,
      data
    );
  }

  /**
   * Gọi API bật/tắt trạng thái hoạt động của chi nhánh (OPEN <-> CLOSED)
   */
  toggleBranchStatus(id: number, currentStatus: BranchStatus): Observable<ApiResponse<BranchResponseDto>> {
    const newStatus: BranchStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    return this.http.put<ApiResponse<BranchResponseDto>>(
      `${this.baseUrl}/branches/${id}`,
      { status: newStatus }
    );
  }

  /**
   * Gọi API public lấy toàn bộ danh sách chi nhánh (không phân trang) phục vụ đổ vào dropdown
   */
  getAllBranches(): Observable<ApiResponse<BranchResponseDto[]>> {
    return this.http.get<ApiResponse<BranchResponseDto[]>>(
      `${this.baseUrl}/public/branches`
    );
  }

  /**
   * Gọi API tải ảnh lên hệ thống cho chi nhánh (lưu trong subFolder: branches)
   * Trả về thông tin fileKey và fileUrl để xem trước và gửi kèm khi tạo/sửa chi nhánh
   * @param file File ảnh được chọn từ máy người dùng
   */
  uploadBranchImage(file: File): Observable<ApiResponse<{ originalFileName: string; fileKey: string; fileUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ originalFileName: string; fileKey: string; fileUrl: string }>>(
      `${this.baseUrl}/upload/image?subFolder=branches`,
      formData
    );
  }
}
