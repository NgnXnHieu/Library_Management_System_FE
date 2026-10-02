/**
 * Enum trạng thái phiếu mượn (khớp với com.library.enums.BorrowStatus)
 */
export type BorrowStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';

/**
 * Enum trạng thái thanh toán (khớp với com.library.enums.PaymentStatus)
 */
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'CANCELLED';

/**
 * Interface chi tiết sách mượn trong phiếu
 */
export interface BorrowItemResponse {
  id: number;
  inventoryId?: number;
  bookId: number;
  bookTitle: string;
  isbn?: string;
  quantity: number;
  rentalPrice: number;
}

/**
 * Interface DTO thông tin phiếu mượn sách.
 * Khớp 100% với com.library.dto.borrow.BorrowSlipResponseDto trong Spring Boot.
 */
export interface BorrowSlipResponseDto {
  id: number;
  borrowCode: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  staffId: number;
  staffName: string;
  branchId: number;
  branchName: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: BorrowStatus;
  paymentStatus: PaymentStatus;
  totalQuantity: number;
  totalAmount: number;
  items?: BorrowItemResponse[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface tham số lọc danh sách phiếu mượn (khớp BorrowSlipFilterRequestForm)
 */
export interface BorrowSlipFilterParams {
  page?: number;
  size?: number;
  borrowCode?: string;
  customerSearch?: string;
  branchId?: number;
  status?: BorrowStatus;
  paymentStatus?: PaymentStatus;
  fromBorrowedAt?: string;
  toBorrowedAt?: string;
  fromReturnedAt?: string;
  toReturnedAt?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  keyword?: string;
  sortDirection?: 'ASC' | 'DESC';
}

/**
 * Interface thông tin một cuốn sách khi tạo phiếu mượn (BorrowItemCreateRequestForm)
 */
export interface BorrowItemCreateRequest {
  inventoryId: number;
  quantity: number;
}

/**
 * Interface dữ liệu tạo mới phiếu mượn sách (BorrowSlipCreateRequestForm)
 */
export interface BorrowSlipCreateRequest {
  customerId: number;
  items: BorrowItemCreateRequest[];
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
}

