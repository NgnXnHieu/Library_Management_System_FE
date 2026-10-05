import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookResponseDto } from '../../shared/models/book.model';
import { CategorySimpleDto } from '../../shared/models/category.model';

/**
 * TRANG CHỦ DÀNH CHO ĐỘC GIẢ & KHÁCH HÀNG (CUSTOMER PORTAL HOMEPAGE)
 * - Banner giới thiệu & Thống kê thư viện
 * - Danh mục thể loại thực tế từ DB với icon sinh động, click chuyển sang /books theo thể loại
 * - Danh sách sách thực tế (8 cuốn mới nhất) từ GET /public/books kèm Tab chọn nhanh thể loại
 * - Quy trình 3 bước mượn sách đơn giản
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public authService = inject(AuthService);
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);

  // Dữ liệu danh sách sách và thể loại
  public books: BookResponseDto[] = [];
  public categories: CategorySimpleDto[] = [];
  public isLoadingBooks: boolean = false;
  public isLoadingCategories: boolean = false;

  // Thể loại đang chọn trên tab lọc nhanh ở trang chủ (null = Tất cả)
  public selectedCategoryId: number | null = null;

  ngOnInit(): void {
    // Tải danh mục thể loại và danh sách sách mới nhất
    this.loadCategories();
    this.loadHomeBooks(null);
  }

  /**
   * Tải danh mục thể loại hoạt động từ API
   */
  public loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoryService.getActiveCategories().subscribe({
      next: (res) => {
        this.isLoadingCategories = false;
        this.categories = res.data || [];
      },
      error: (err) => {
        this.isLoadingCategories = false;
        console.error('[HomeComponent] Lỗi khi tải thể loại:', err);
      }
    });
  }

  /**
   * Tải danh sách sách thực tế từ API GET /public/books
   * @param categoryId Mã thể loại (nếu lọc theo tab)
   */
  public loadHomeBooks(categoryId: number | null = null): void {
    this.isLoadingBooks = true;

    const filter: any = {
      page: 0,
      size: 8,
      sortBy: 'createdAt',
      sortDir: 'desc'
    };

    if (categoryId !== null) {
      filter.categoryId = categoryId;
    }

    this.bookService.getPublicBooks(filter).subscribe({
      next: (res) => {
        this.isLoadingBooks = false;
        this.books = res.data?.content || [];
      },
      error: (err) => {
        this.isLoadingBooks = false;
        console.error('[HomeComponent] Lỗi khi tải sách trang chủ:', err);
      }
    });
  }

  /**
   * Chuyển tab thể loại nhanh trên Trang chủ
   */
  public selectCategoryTab(categoryId: number | null): void {
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.loadHomeBooks(categoryId);
  }

  /**
   * Trợ giúp hiển thị icon sinh động theo tên thể loại
   */
  public getCategoryIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('công nghệ') || lower.includes('cntt') || lower.includes('lập trình') || lower.includes('tin học')) return '💻';
    if (lower.includes('kinh tế') || lower.includes('kinh doanh') || lower.includes('tài chính') || lower.includes('khởi nghiệp')) return '📈';
    if (lower.includes('văn học') || lower.includes('tiểu thuyết') || lower.includes('thơ')) return '🎨';
    if (lower.includes('kỹ năng') || lower.includes('tâm lý') || lower.includes('phát triển')) return '🌱';
    if (lower.includes('khoa học') || lower.includes('y học') || lower.includes('sinh học') || lower.includes('đời sống')) return '🔬';
    if (lower.includes('lịch sử') || lower.includes('triết học') || lower.includes('chính trị')) return '📜';
    if (lower.includes('thiếu nhi') || lower.includes('trẻ em') || lower.includes('truyện tranh')) return '🧸';
    if (lower.includes('ngoại ngữ') || lower.includes('tiếng anh')) return '🌐';
    return '📚';
  }
}
