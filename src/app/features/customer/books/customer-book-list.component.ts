import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { BookFilterRequest, BookResponseDto } from '../../../shared/models/book.model';
import { CategorySimpleDto } from '../../../shared/models/category.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

/**
 * Interface cho các khoảng giá chọn nhanh
 */
interface PricePreset {
  label: string;
  min: number | null;
  max: number | null;
}

/**
 * MÀN HÌNH DANH SÁCH SÁCH DÀNH CHO ĐỘC GIẢ & KHÁCH HÀNG (CUSTOMER VIEW)
 * - Thiết kế giao diện hiện đại 2 cột (Sidebar Filter + Main Book Grid) chuẩn E-commerce cao cấp.
 * - Bộ lọc tìm kiếm đa năng: từ khóa, danh mục thể loại, khoảng giá chọn nhanh & tùy chỉnh, sắp xếp linh hoạt.
 * - Tuyệt đối KHÔNG có ô lọc theo trạng thái hiển thị (status) - bảo mật 100%.
 * - Hỗ trợ Active Filter Chips, Skeleton Loading, Mobile Drawer và phân trang tái sử dụng.
 */
@Component({
  selector: 'app-customer-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './customer-book-list.component.html',
  styleUrl: './customer-book-list.component.css'
})
export class CustomerBookListComponent implements OnInit {

  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Danh sách dữ liệu
  public books: BookResponseDto[] = [];
  public categories: CategorySimpleDto[] = [];
  public isLoading: boolean = false;
  public isMobileFilterOpen: boolean = false;

  // Tiêu chí lọc tìm kiếm
  public searchKeyword: string = '';
  public selectedCategoryId: number | null = null;
  public selectedCategoryName: string = '';
  public minPrice: number | null = null;
  public maxPrice: number | null = null;
  public sortBy: string = 'createdAt';
  public sortDir: string = 'desc';

  // Thông số phân trang (0-indexed)
  public currentPage: number = 0;
  public pageSize: number = 12;
  public totalElements: number = 0;
  public totalPages: number = 0;

  // Danh sách khoảng giá gợi ý chọn nhanh (Presets)
  public pricePresets: PricePreset[] = [
    { label: 'Tất cả mức giá', min: null, max: null },
    { label: 'Dưới 50.000 đ', min: 0, max: 50000 },
    { label: '50.000 đ - 100.000 đ', min: 50000, max: 100000 },
    { label: '100.000 đ - 200.000 đ', min: 100000, max: 200000 },
    { label: 'Trên 200.000 đ', min: 200000, max: null }
  ];

  ngOnInit(): void {
    // Tải danh sách thể loại active để hiển thị menu bên sidebar
    this.categoryService.getActiveCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
        this.updateCategoryNameFromList();
      },
      error: (err) => console.error('[CustomerBookList] Lỗi tải thể loại:', err)
    });

    // Lắng nghe thay đổi Query Parameters trên URL
    this.route.queryParams.subscribe(params => {
      this.selectedCategoryId = params['categoryId'] ? Number(params['categoryId']) : null;
      this.selectedCategoryName = params['categoryName'] || '';
      this.searchKeyword = params['title'] || params['keyword'] || '';
      this.minPrice = params['minPrice'] != null && params['minPrice'] !== '' ? Number(params['minPrice']) : null;
      this.maxPrice = params['maxPrice'] != null && params['maxPrice'] !== '' ? Number(params['maxPrice']) : null;
      this.sortBy = params['sortBy'] || 'createdAt';
      this.sortDir = params['sortDir'] || 'desc';
      this.currentPage = params['page'] ? Number(params['page']) : 0;
      this.pageSize = params['size'] ? Number(params['size']) : 12;

      this.updateCategoryNameFromList();
      this.loadBooks();
    });
  }

  private updateCategoryNameFromList(): void {
    if (this.selectedCategoryId && !this.selectedCategoryName && this.categories.length > 0) {
      const found = this.categories.find(c => c.id === this.selectedCategoryId);
      if (found) {
        this.selectedCategoryName = found.name;
      }
    }
  }

  /**
   * Gọi API GET /public/books với đầy đủ các tham số lọc hiện tại
   */
  public loadBooks(): void {
    this.isLoading = true;

    const filter: BookFilterRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDir: this.sortDir
    };

    if (this.selectedCategoryId != null) {
      filter.categoryId = this.selectedCategoryId;
    }
    if (this.searchKeyword.trim()) {
      filter.title = this.searchKeyword.trim();
    }
    if (this.minPrice != null && this.minPrice >= 0) {
      filter.minPrice = this.minPrice;
    }
    if (this.maxPrice != null && this.maxPrice >= 0) {
      filter.maxPrice = this.maxPrice;
    }

    this.bookService.getPublicBooks(filter).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.data) {
          this.books = response.data.content || [];
          this.totalElements = response.data.totalElements || 0;
          this.totalPages = response.data.totalPages || 0;
          this.currentPage = response.data.number || 0;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[CustomerBookList] Lỗi tải danh sách sách:', err);
      }
    });
  }

  /**
   * Áp dụng bộ lọc tìm kiếm
   */
  public applyFilters(): void {
    this.currentPage = 0;
    this.isMobileFilterOpen = false;
    this.updateQueryParams();
  }

  /**
   * Chọn thể loại sách từ Sidebar
   */
  public selectCategory(category: CategorySimpleDto | null): void {
    if (category) {
      this.selectedCategoryId = category.id;
      this.selectedCategoryName = category.name;
    } else {
      this.selectedCategoryId = null;
      this.selectedCategoryName = '';
    }
    this.currentPage = 0;
    this.isMobileFilterOpen = false;
    this.updateQueryParams();
  }

  /**
   * Chọn khoảng giá nhanh từ danh sách Presets
   */
  public selectPricePreset(preset: PricePreset): void {
    this.minPrice = preset.min;
    this.maxPrice = preset.max;
    this.applyFilters();
  }

  /**
   * Kiểm tra preset giá có đang được kích hoạt hay không
   */
  public isPricePresetActive(preset: PricePreset): boolean {
    return this.minPrice === preset.min && this.maxPrice === preset.max;
  }

  /**
   * Đổi phương thức sắp xếp nhanh (Sort Tab)
   */
  public setSort(sortBy: string, sortDir: string): void {
    this.sortBy = sortBy;
    this.sortDir = sortDir;
    this.currentPage = 0;
    this.updateQueryParams();
  }

  /**
   * Kiểm tra tab sắp xếp có đang active không
   */
  public isSortActive(sortBy: string, sortDir: string): boolean {
    return this.sortBy === sortBy && this.sortDir === sortDir;
  }

  /**
   * Đếm tổng số tiêu chí đang được áp dụng lọc
   */
  public get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCategoryId !== null) count++;
    if (this.searchKeyword && this.searchKeyword.trim().length > 0) count++;
    if (this.minPrice !== null || this.maxPrice !== null) count++;
    return count;
  }

  /**
   * Kiểm tra có đang áp dụng bất kỳ bộ lọc nào không
   */
  public hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  /**
   * Xóa nhanh nội dung trong ô tìm kiếm
   */
  public clearSearchInput(): void {
    if (this.searchKeyword) {
      this.searchKeyword = '';
      this.applyFilters();
    }
  }

  /**
   * Xóa bộ lọc thể loại
   */
  public removeCategoryFilter(): void {
    this.selectedCategoryId = null;
    this.selectedCategoryName = '';
    this.currentPage = 0;
    this.updateQueryParams();
  }

  /**
   * Xóa bộ lọc từ khóa tìm kiếm
   */
  public removeKeywordFilter(): void {
    this.searchKeyword = '';
    this.currentPage = 0;
    this.updateQueryParams();
  }

  /**
   * Xóa bộ lọc khoảng giá
   */
  public removePriceFilter(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage = 0;
    this.updateQueryParams();
  }

  /**
   * Đặt lại tất cả các bộ lọc về mặc định
   */
  public resetFilters(): void {
    this.selectedCategoryId = null;
    this.selectedCategoryName = '';
    this.searchKeyword = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'createdAt';
    this.sortDir = 'desc';
    this.currentPage = 0;
    this.isMobileFilterOpen = false;
    this.updateQueryParams();
  }

  /**
   * Đóng/Mở bộ lọc trên Mobile
   */
  public toggleMobileFilter(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  /**
   * Xử lý chuyển trang
   */
  public onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.updateQueryParams();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Thay đổi kích thước trang
   */
  public onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0;
    this.updateQueryParams();
  }

  /**
   * Cập nhật URL Query Parameters
   */
  private updateQueryParams(): void {
    const queryParams: Record<string, any> = {};

    if (this.selectedCategoryId != null) {
      queryParams['categoryId'] = this.selectedCategoryId;
      if (this.selectedCategoryName) {
        queryParams['categoryName'] = this.selectedCategoryName;
      }
    }
    if (this.searchKeyword.trim()) {
      queryParams['title'] = this.searchKeyword.trim();
    }
    if (this.minPrice != null && this.minPrice >= 0) {
      queryParams['minPrice'] = this.minPrice;
    }
    if (this.maxPrice != null && this.maxPrice >= 0) {
      queryParams['maxPrice'] = this.maxPrice;
    }
    if (this.sortBy !== 'createdAt') {
      queryParams['sortBy'] = this.sortBy;
    }
    if (this.sortDir !== 'desc') {
      queryParams['sortDir'] = this.sortDir;
    }
    if (this.currentPage > 0) {
      queryParams['page'] = this.currentPage;
    }
    if (this.pageSize !== 12) {
      queryParams['size'] = this.pageSize;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: ''
    });
  }
}
