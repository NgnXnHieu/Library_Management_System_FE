import { DisplayStatus } from './category.model';

/**
 * Interface DTO thông tin bản ghi tồn kho sách từ Backend
 */
export interface InventoryResponseDto {
  id: number;
  branchId: number;
  branchName: string;
  categoryId: number;
  categoryName: string;
  bookId: number;
  bookTitle: string;
  isbn: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  coverImageUrl?: string;
  price?: number;
  rentalPrice?: number;
  fineAmount?: number;
  totalQuantity: number;
  availableQuantity: number;
  status: DisplayStatus;
  shelfLocation?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface tham số lọc danh sách tồn kho sách
 */
export interface InventoryFilterRequest {
  branchId?: number;
  categoryId?: number;
  bookTitle?: string;
  minPrice?: number;
  maxPrice?: number;
  minRentalPrice?: number;
  maxRentalPrice?: number;
  minFineAmount?: number;
  maxFineAmount?: number;
  status?: DisplayStatus;
  shelfLocation?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  size?: number;
}
