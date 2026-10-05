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
  staffPhone?: string;
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
  customerId?: number;
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

/**
 * Kiểm tra xem phiếu mượn có bị quá hạn hay không.
 * Quá hạn khi:
 * 1. Đã được đánh dấu status là 'OVERDUE'
 * 2. Hoặc đang ở trạng thái 'BORROWED' và thời gian hiện tại đã vượt quá hạn trả (dueAt)
 */
export function isBorrowSlipOverdue(slip: BorrowSlipResponseDto | null | undefined): boolean {
  if (!slip) return false;
  if (slip.status === 'OVERDUE') return true;
  if (slip.status === 'BORROWED' && slip.dueAt) {
    const dueTime = new Date(slip.dueAt).getTime();
    return Date.now() > dueTime;
  }
  return false;
}

/**
 * Tính số ngày quá hạn, làm tròn lên 1 ngày (Math.ceil).
 * Ví dụ: Quá 1 tiếng -> 1 ngày, quá 1.5 ngày -> 2 ngày.
 */
export function getBorrowSlipOverdueDays(slip: BorrowSlipResponseDto | null | undefined): number {
  if (!slip || !slip.dueAt) return 0;
  const dueTime = new Date(slip.dueAt).getTime();
  const diffMs = Date.now() - dueTime;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Lấy nhãn trạng thái hiển thị của phiếu mượn.
 * Nếu đang mượn mà bị quá hạn -> hiển thị 'Quá hạn'.
 */
export function getBorrowSlipStatusLabel(slip: BorrowSlipResponseDto | null | undefined): string {
  if (!slip) return '';
  if (isBorrowSlipOverdue(slip)) {
    return 'Quá hạn';
  }
  switch (slip.status) {
    case 'BORROWED': return 'Đang mượn';
    case 'RETURNED': return 'Đã trả';
    case 'OVERDUE': return 'Quá hạn';
    case 'CANCELLED': return 'Đã hủy';
    default: return slip.status;
  }
}

/**
 * Lấy class badge hiển thị trạng thái của phiếu mượn.
 * Nếu quá hạn -> trả về 'badge-overdue'.
 */
export function getBorrowSlipStatusBadgeClass(slip: BorrowSlipResponseDto | null | undefined): string {
  if (!slip) return 'badge-default';
  if (isBorrowSlipOverdue(slip)) {
    return 'badge-overdue';
  }
  switch (slip.status) {
    case 'BORROWED': return 'badge-borrowed';
    case 'RETURNED': return 'badge-returned';
    case 'OVERDUE': return 'badge-overdue';
    case 'CANCELLED': return 'badge-cancelled';
    default: return 'badge-default';
  }
}

