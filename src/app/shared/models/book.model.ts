import { DisplayStatus } from './category.model';

/**
 * Interface DTO thông tin chi tiết đầu sách trả về từ Backend
 */
export interface BookResponseDto {
  id: number;
  categoryId: number;
  categoryName: string;
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  coverImageKey?: string;
  coverImageUrl?: string;
  price?: number;
  rentalPrice?: number;
  fineAmount?: number;
  status: DisplayStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface tham số lọc danh sách đầu sách
 */
export interface BookFilterRequest {
  isbn?: string;
  title?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  publicationYearFrom?: number;
  publicationYearTo?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRentalPrice?: number;
  maxRentalPrice?: number;
  minFineAmount?: number;
  maxFineAmount?: number;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/**
 * Interface dữ liệu thêm mới đầu sách
 */
export interface BookCreateRequest {
  categoryId: number;
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  coverImageKey?: string;
  price?: number;
  rentalPrice?: number;
  status?: DisplayStatus;
}

/**
 * Interface dữ liệu cập nhật đầu sách
 */
export interface BookUpdateRequest {
  categoryId?: number;
  isbn?: string;
  title?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  description?: string;
  coverImageKey?: string;
  price?: number;
  rentalPrice?: number;
  status?: DisplayStatus;
}
